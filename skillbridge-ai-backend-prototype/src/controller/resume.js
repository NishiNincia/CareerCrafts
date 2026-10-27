import { randomUUID } from "node:crypto";
import pool from "../config/db.js";
import { analyzeResumeText } from "../services/resumeParser.js";
import { extractResumeText } from "../services/resumeFile.js";
import { recommendCourses } from "../services/courseRecommendations.js";

function toResumeResponse(id, filename, parsed, recommendations, createdAt) {
    return {
        id,
        filename,
        ...parsed,
        createdAt,
        recommendations,
    };
}

async function saveResume(userId, filename, parsed, recommendations) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const resumeId = randomUUID();
        const inserted = await client.query(
            `INSERT INTO resumes (
                id, user_id, filename, name, title, summary, email, phone,
                years_experience, career_level, ats_score, resume_score,
                profile_completion, skill_strength, missing_keywords, missing_skills,
                parsed_json
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
            RETURNING id, created_at`,
            [
                resumeId,
                userId,
                filename,
                parsed.name,
                parsed.title,
                parsed.summary,
                parsed.email,
                parsed.phone,
                parsed.yearsExperience,
                parsed.careerLevel,
                parsed.metrics.atsScore,
                parsed.metrics.resumeScore,
                parsed.metrics.profileCompletion,
                parsed.metrics.skillStrength,
                parsed.metrics.missingKeywords,
                parsed.metrics.missingSkills,
                JSON.stringify(parsed),
            ]
        );
        for (const experience of parsed.experience) {
            await client.query(
                `INSERT INTO resume_experience (resume_id, role, company, period, bullets)
                 VALUES ($1, $2, $3, $4, $5)`,
                [resumeId, experience.role, experience.company, experience.period, experience.bullets]
            );
        }
        for (const education of parsed.education) {
            await client.query(
                `INSERT INTO resume_education (resume_id, school, degree, year)
                 VALUES ($1, $2, $3, $4)`,
                [resumeId, education.school, education.degree, education.year]
            );
        }
        for (const project of parsed.projects) {
            await client.query(
                `INSERT INTO resume_projects (resume_id, name, description)
                 VALUES ($1, $2, $3)`,
                [resumeId, project.name, project.description]
            );
        }
        for (const skill of parsed.skills) {
            await client.query(
                "INSERT INTO resume_skills (resume_id, skill) VALUES ($1, $2)",
                [resumeId, skill]
            );
        }
        for (const certification of parsed.certifications) {
            await client.query(
                "INSERT INTO resume_certifications (resume_id, certification) VALUES ($1, $2)",
                [resumeId, certification]
            );
        }
        for (const [index, course] of recommendations.entries()) {
            await client.query(
                `INSERT INTO resume_recommendations (resume_id, course_id, rank, matching_skills, reason)
                 VALUES ($1, $2, $3, $4, $5)`,
                [resumeId, course.id, index + 1, course.matchingSkills, course.matchReason]
            );
        }

        await client.query("COMMIT");
        return inserted.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function analyzeResume(req, res) {
    try {
        let resumeText;
        let filename = "pasted-resume.txt";

        if (req.file) {
            filename = req.file.originalname;
            resumeText = await extractResumeText(req.file);
        } else if (typeof req.body?.resumeText === "string") {
            resumeText = req.body.resumeText;
        } else {
            return res.status(400).json({
                success: false,
                message: "Upload a PDF or DOCX file, or provide resumeText.",
            });
        }

        if (!resumeText.trim()) {
            return res.status(422).json({
                success: false,
                message: "No readable text was found in the resume.",
            });
        }
        if (resumeText.length > 100_000) {
            return res.status(413).json({
                success: false,
                message: "Resume text exceeds the 100,000 character limit.",
            });
        }

        const parsed = analyzeResumeText(resumeText);
        const recommendations = await recommendCourses(parsed.careerLevel, parsed.metrics.missingSkills);
        const inserted = await saveResume(req.user.id, filename, parsed, recommendations);

        return res.status(201).json({
            success: true,
            resume: toResumeResponse(
                inserted.id,
                filename,
                parsed,
                recommendations,
                inserted.created_at
            ),
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error("Resume analysis failed:", error);
        return res.status(500).json({
            success: false,
            message: "Resume analysis failed. Please try again.",
        });
    }
}

export async function getLatestResume(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, filename, parsed_json, created_at
             FROM resumes
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT 1`,
            [req.user.id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: "No analyzed resume was found." });
        }

        const row = result.rows[0];
        const recommendationRows = await pool.query(
            `SELECT c.id, c.title, c.provider, c.duration_hours, c.level, c.thumbnail_color,
                    rr.matching_skills, rr.reason
             FROM resume_recommendations rr
             JOIN courses c ON c.id = rr.course_id
             WHERE rr.resume_id = $1
             ORDER BY rr.rank`,
            [row.id]
        );
        const recommendations = recommendationRows.rows.map((course) => ({
            id: course.id,
            title: course.title,
            provider: course.provider,
            durationHours: course.duration_hours,
            level: course.level,
            progress: 0,
            thumbnailColor: course.thumbnail_color,
            matchReason: course.reason,
            matchingSkills: course.matching_skills,
        }));

        return res.json({
            success: true,
            resume: toResumeResponse(row.id, row.filename, row.parsed_json, recommendations, row.created_at),
        });
    } catch (error) {
        console.error("Loading analyzed resume failed:", error);
        return res.status(500).json({ success: false, message: "Could not load the analyzed resume." });
    }
}