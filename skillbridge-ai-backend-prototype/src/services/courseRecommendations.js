import pool from "../config/db.js";

function normalizeSkill(skill) {
    return skill.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function recommendCourses(careerLevel, missingSkills) {
    const result = await pool.query(
        `SELECT c.id, c.title, c.provider, c.duration_hours, c.level,
                c.thumbnail_color, c.match_reason,
                COALESCE(array_agg(cs.skill) FILTER (WHERE cs.skill IS NOT NULL), '{}') AS skills
         FROM courses c
         LEFT JOIN course_skills cs ON cs.course_id = c.id
         WHERE c.level = $1
         GROUP BY c.id
         ORDER BY c.id`,
        [careerLevel]
    );

    const gaps = new Set(missingSkills.map(normalizeSkill));
    return result.rows
        .map((course) => {
            const matchingSkills = course.skills.filter((skill) => gaps.has(normalizeSkill(skill)));
            const reason = matchingSkills.length
                ? `Builds ${matchingSkills.join(", ")} skills identified as gaps for your ${careerLevel} profile.`
                : `Recommended learning for your ${careerLevel} career level.`;
            return {
                id: course.id,
                title: course.title,
                provider: course.provider,
                durationHours: course.duration_hours,
                level: course.level,
                progress: 0,
                thumbnailColor: course.thumbnail_color,
                matchReason: reason || course.match_reason,
                matchingSkills,
            };
        })
        .sort((a, b) => b.matchingSkills.length - a.matchingSkills.length || a.title.localeCompare(b.title))
        .slice(0, 6);
}
