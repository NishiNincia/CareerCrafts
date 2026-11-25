import pool from "../config/db.js";
import { notifyWorkersOfNewGig } from "../services/notificationCenter.js";
import { validateGigPayload } from "../services/gigValidation.js";

function mapGig(row) {
    return {
        id: row.id,
        creatorId: row.employer_user_id,
        creatorName: row.creator_name,
        title: row.title,
        description: row.description,
        requiredSkills: row.required_skills,
        budget: Number(row.budget),
        currency: "INR",
        deadline: row.deadline,
        workMode: row.work_mode,
        locationAddress: row.location_address,
        geo: row.latitude === null ? null : { lat: Number(row.latitude), lng: Number(row.longitude) },
        status: row.status,
        createdAt: row.created_at,
    };
}

export async function getWorkerGigs(req, res) {
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 120) : "";
    const skill = typeof req.query.skill === "string" ? req.query.skill.trim().slice(0, 100) : "";
    try {
        const result = await pool.query(
            `SELECT g.*, u.name AS creator_name
             FROM marketplace_gigs g
             JOIN users u ON u.id = g.employer_user_id
             WHERE g.status = 'open'
               AND ($1 = '' OR g.title ILIKE '%' || $1 || '%' OR g.description ILIKE '%' || $1 || '%')
               AND ($2 = '' OR EXISTS (
                   SELECT 1 FROM unnest(g.required_skills) AS skill
                   WHERE lower(skill) = lower($2)
               ))
             ORDER BY g.created_at DESC
             LIMIT 100`,
            [search, skill]
        );
        return res.json({ success: true, data: result.rows.map(mapGig) });
    } catch (error) {
        console.error("Loading gigs failed:", error);
        return res.status(500).json({ success: false, message: "Could not load available gigs." });
    }
}

export async function createEmployerGig(req, res) {
    const validation = validateGigPayload(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    let client;
    let transactionOpen = false;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        transactionOpen = true;
        const gigResult = await client.query(
            `INSERT INTO marketplace_gigs (
                employer_user_id, title, description, required_skills, budget,
                deadline, work_mode, location_address, latitude, longitude
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                req.user.id,
                validation.value.title,
                validation.value.description,
                validation.value.requiredSkills,
                validation.value.budget,
                validation.value.deadline,
                validation.value.workMode,
                validation.value.locationAddress,
                validation.value.locationLat,
                validation.value.locationLng,
            ]
        );
        const gig = gigResult.rows[0];
        await notifyWorkersOfNewGig(client, gig);
        await client.query("COMMIT");
        transactionOpen = false;
        return res.status(201).json({
            success: true,
            data: mapGig({ ...gig, creator_name: req.user.name }),
        });
    } catch (error) {
        if (transactionOpen) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rolling back gig creation failed:", rollbackError);
            }
        }
        console.error("Creating employer gig failed:", error);
        return res.status(500).json({ success: false, message: "Could not create this gig." });
    } finally {
        client?.release();
    }
}
