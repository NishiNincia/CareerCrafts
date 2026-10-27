import pool from "../config/db.js";

export async function getCourseRecommendations(req, res) {
    try {
        const resumeResult = await pool.query(
            `SELECT id FROM resumes
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT 1`,
            [req.user.id]
        );
        if (!resumeResult.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Analyze a resume before requesting personalized course recommendations.",
            });
        }

        const result = await pool.query(
            `SELECT c.id, c.title, c.provider, c.duration_hours, c.level, c.thumbnail_color,
                    rr.matching_skills, rr.reason
             FROM resume_recommendations rr
             JOIN courses c ON c.id = rr.course_id
             WHERE rr.resume_id = $1
             ORDER BY rr.rank`,
            [resumeResult.rows[0].id]
        );
        return res.json({
            success: true,
            courses: result.rows.map((course) => ({
                id: course.id,
                title: course.title,
                provider: course.provider,
                durationHours: course.duration_hours,
                level: course.level,
                progress: 0,
                thumbnailColor: course.thumbnail_color,
                matchReason: course.reason,
                matchingSkills: course.matching_skills,
            })),
        });
    } catch (error) {
        console.error("Loading course recommendations failed:", error);
        return res.status(500).json({
            success: false,
            message: "Could not load course recommendations.",
        });
    }
}