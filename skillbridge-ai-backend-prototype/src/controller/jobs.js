import pool from "../config/db.js";
import {
    calculateDistanceKm,
    mapJobListing,
    validateJobPayload,
} from "../services/jobListings.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getJobSelect(includeWorkerApplication = false) {
    return `
        SELECT j.*, employer.name AS company${includeWorkerApplication ? ", mine.status AS application_status" : ""},
               COALESCE(
                   ARRAY(
                       SELECT skill.skill
                       FROM marketplace_job_skills skill
                       WHERE skill.job_id = j.id
                       ORDER BY skill.skill
                   ),
                   ARRAY[]::TEXT[]
               ) AS skills
        FROM marketplace_jobs j
        JOIN users employer ON employer.id = j.employer_user_id
        ${includeWorkerApplication
            ? "LEFT JOIN marketplace_job_applications mine ON mine.job_id = j.id AND mine.worker_id = $1"
            : ""}
    `;
}

async function rollbackTransaction(client) {
    try {
        await client.query("ROLLBACK");
    } catch (error) {
        console.error("Rolling back job listing transaction failed:", error);
    }
}

function getCoordinates(query) {
    if (query.lat === undefined || query.lng === undefined) {
        return { error: "Provide latitude and longitude for your search location." };
    }
    const latitude = Number(query.lat);
    const longitude = Number(query.lng);
    const radiusKm = Number(query.radiusKm ?? 10);
    if (
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
        !Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 100
    ) {
        return { error: "Provide valid latitude and longitude and a radius from 1 to 100 km." };
    }
    return { latitude, longitude, radiusKm };
}

async function getResumeSkills(userId) {
    const result = await pool.query(
        `SELECT parsed_json->'skills' AS skills
         FROM resumes
         WHERE user_id = $1 AND parsed_json ? 'skills'
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [userId]
    );
    const skills = result.rows[0]?.skills;
    return Array.isArray(skills) ? skills.filter((skill) => typeof skill === "string") : null;
}

export async function getNearbyJobs(req, res) {
    const coordinates = getCoordinates(req.query);
    if (coordinates.error) {
        return res.status(400).json({ success: false, message: coordinates.error });
    }

    try {
        const [result, resumeSkills] = await Promise.all([
            pool.query(
                `${getJobSelect(true)}
                 WHERE j.status = 'open'
                 ORDER BY j.created_at DESC
                 LIMIT 500`,
                [req.user.id]
            ),
            getResumeSkills(req.user.id),
        ]);
        const jobs = result.rows
            .map((row) => {
                const distanceKm = calculateDistanceKm(
                    coordinates.latitude,
                    coordinates.longitude,
                    Number(row.latitude),
                    Number(row.longitude)
                );
                return { row, distanceKm };
            })
            .filter(({ distanceKm }) => distanceKm <= coordinates.radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm || new Date(b.row.created_at) - new Date(a.row.created_at))
            .slice(0, 100)
            .map(({ row, distanceKm }) => mapJobListing(row, { distanceKm, resumeSkills }));

        return res.json({ success: true, data: jobs });
    } catch (error) {
        console.error("Loading nearby jobs failed:", error);
        return res.status(500).json({ success: false, message: "Could not load nearby jobs." });
    }
}

export async function applyToJob(req, res) {
    const jobId = req.params.jobId;
    if (!UUID_PATTERN.test(jobId)) {
        return res.status(400).json({ success: false, message: "Invalid job ID." });
    }

    try {
        const result = await pool.query(
            `INSERT INTO marketplace_job_applications (job_id, worker_id)
             SELECT id, $2 FROM marketplace_jobs
             WHERE id = $1 AND status = 'open'
             ON CONFLICT (job_id, worker_id) DO NOTHING
             RETURNING id, job_id, status, created_at`,
            [jobId, req.user.id]
        );
        if (result.rows.length) {
            const application = result.rows[0];
            return res.status(201).json({
                success: true,
                data: {
                    id: application.id,
                    jobId: application.job_id,
                    status: application.status,
                    appliedAt: application.created_at,
                },
            });
        }

        const job = await pool.query(
            "SELECT status FROM marketplace_jobs WHERE id = $1",
            [jobId]
        );
        if (!job.rows.length || job.rows[0].status !== "open") {
            return res.status(404).json({ success: false, message: "This job is no longer available." });
        }
        return res.status(409).json({ success: false, message: "You have already applied to this job." });
    } catch (error) {
        console.error("Applying to job failed:", error);
        return res.status(500).json({ success: false, message: "Could not submit your application." });
    }
}

export async function updateEmployerJob(req, res) {
    const jobId = req.params.jobId;
    if (!UUID_PATTERN.test(jobId)) {
        return res.status(400).json({ success: false, message: "Invalid job ID." });
    }

    const validation = validateJobPayload(req.body);
    if (validation.error) {
        return res.status(400).json({ success: false, message: validation.error });
    }

    let client;
    let transactionOpen = false;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        transactionOpen = true;
        const jobResult = await client.query(
            `UPDATE marketplace_jobs
             SET title = $3, description = $4, employment_type = $5,
                 salary_min = $6, salary_max = $7, address = $8,
                 latitude = $9, longitude = $10, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND employer_user_id = $2 AND status = 'open'
             RETURNING *`,
            [
                jobId,
                req.user.id,
                validation.value.title,
                validation.value.description,
                validation.value.employmentType,
                validation.value.salaryMin,
                validation.value.salaryMax,
                validation.value.address,
                validation.value.latitude,
                validation.value.longitude,
            ]
        );
        if (!jobResult.rows.length) {
            await client.query("ROLLBACK");
            transactionOpen = false;
            return res.status(404).json({ success: false, message: "Open job listing not found." });
        }

        await client.query("DELETE FROM marketplace_job_skills WHERE job_id = $1", [jobId]);
        await client.query(
            `INSERT INTO marketplace_job_skills (job_id, skill)
             SELECT $1, skill FROM unnest($2::TEXT[]) AS skill`,
            [jobId, validation.value.skills]
        );
        await client.query("COMMIT");
        transactionOpen = false;

        return res.json({
            success: true,
            data: mapJobListing({
                ...jobResult.rows[0],
                company: req.user.name,
                skills: validation.value.skills,
            }),
        });
    } catch (error) {
        if (transactionOpen) {
            await rollbackTransaction(client);
        }
        console.error("Updating employer job failed:", error);
        return res.status(500).json({ success: false, message: "Could not update this job." });
    } finally {
        client?.release();
    }
}

export async function closeEmployerJob(req, res) {
    const jobId = req.params.jobId;
    if (!UUID_PATTERN.test(jobId)) {
        return res.status(400).json({ success: false, message: "Invalid job ID." });
    }

    try {
        const result = await pool.query(
            `UPDATE marketplace_jobs
             SET status = 'closed', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND employer_user_id = $2 AND status = 'open'
             RETURNING id, status`,
            [jobId, req.user.id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: "Open job listing not found." });
        }
        return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Closing employer job failed:", error);
        return res.status(500).json({ success: false, message: "Could not close this job." });
    }
}

export async function getEmployerJobs(req, res) {
    try {
        const result = await pool.query(
            `${getJobSelect()}
             WHERE j.employer_user_id = $1 AND j.status = 'open'
             ORDER BY j.created_at DESC`,
            [req.user.id]
        );
        return res.json({
            success: true,
            data: result.rows.map((row) => mapJobListing(row)),
        });
    } catch (error) {
        console.error("Loading employer jobs failed:", error);
        return res.status(500).json({ success: false, message: "Could not load your jobs." });
    }
}

export async function createEmployerJob(req, res) {
    const validation = validateJobPayload(req.body);
    if (validation.error) {
        return res.status(400).json({ success: false, message: validation.error });
    }

    let client;
    let transactionOpen = false;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        transactionOpen = true;
        const jobResult = await client.query(
            `INSERT INTO marketplace_jobs (
                employer_user_id, title, description, employment_type,
                salary_min, salary_max, address, latitude, longitude
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                req.user.id,
                validation.value.title,
                validation.value.description,
                validation.value.employmentType,
                validation.value.salaryMin,
                validation.value.salaryMax,
                validation.value.address,
                validation.value.latitude,
                validation.value.longitude,
            ]
        );
        const job = jobResult.rows[0];
        await client.query(
            `INSERT INTO marketplace_job_skills (job_id, skill)
             SELECT $1, skill FROM unnest($2::TEXT[]) AS skill`,
            [job.id, validation.value.skills]
        );
        await client.query("COMMIT");
        transactionOpen = false;

        return res.status(201).json({
            success: true,
            data: mapJobListing({
                ...job,
                company: req.user.name,
                skills: validation.value.skills,
            }),
        });
    } catch (error) {
        if (transactionOpen) {
            await rollbackTransaction(client);
        }
        console.error("Creating employer job failed:", error);
        return res.status(500).json({ success: false, message: "Could not save this job." });
    } finally {
        client?.release();
    }
}
