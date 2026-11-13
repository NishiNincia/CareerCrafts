import pool from "../config/db.js";
import { generateLearningRoadmap } from "../services/learningRoadmapGenerator.js";

function getArray(value) {
    return Array.isArray(value) ? value : [];
}

async function loadRoadmap(userId, roadmapId = null) {
    const roadmapResult = await pool.query(
        `SELECT id, resume_id, target_role, title, overview, existing_skills, skill_gaps,
                status, created_at, updated_at
         FROM learning_roadmaps
         WHERE user_id = $1 AND ($2::uuid IS NULL OR id = $2)
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, roadmapId]
    );
    if (!roadmapResult.rows.length) return null;

    const roadmap = roadmapResult.rows[0];
    const [moduleResult, progressResult, assessmentResult, projectResult] = await Promise.all([
        pool.query(
            `SELECT id, module_order, title, skill, description
             FROM learning_modules WHERE roadmap_id = $1 ORDER BY module_order`,
            [roadmap.id]
        ),
        pool.query(
            `SELECT module_id, completed_lessons, completed_exercises, mastered
             FROM user_learning_progress WHERE user_id = $1 AND roadmap_id = $2`,
            [userId, roadmap.id]
        ),
        pool.query(
            `SELECT id, module_id, title, assessment_type, questions, pass_score
             FROM learning_assessments WHERE roadmap_id = $1
             ORDER BY CASE WHEN assessment_type = 'module' THEN 0 ELSE 1 END`,
            [roadmap.id]
        ),
        pool.query(
            `SELECT id, title, description, requirements, status
             FROM learning_projects WHERE roadmap_id = $1 ORDER BY created_at`,
            [roadmap.id]
        ),
    ]);

    const moduleIds = moduleResult.rows.map((module) => module.id);
    const assessmentIds = assessmentResult.rows.map((assessment) => assessment.id);
    const [lessonResult, exerciseResult, attemptResult] = await Promise.all([
        moduleIds.length
            ? pool.query(
                `SELECT id, module_id, lesson_order, title, content
                 FROM learning_lessons WHERE module_id = ANY($1::uuid[]) ORDER BY lesson_order`,
                [moduleIds]
            )
            : { rows: [] },
        moduleIds.length
            ? pool.query(
                `SELECT id, module_id, title, instructions
                 FROM learning_exercises WHERE module_id = ANY($1::uuid[]) ORDER BY title`,
                [moduleIds]
            )
            : { rows: [] },
        assessmentIds.length
            ? pool.query(
                `SELECT DISTINCT ON (assessment_id) assessment_id, score, passed, attempted_at
                 FROM assessment_attempts
                 WHERE user_id = $1 AND assessment_id = ANY($2::uuid[])
                 ORDER BY assessment_id, attempted_at DESC`,
                [userId, assessmentIds]
            )
            : { rows: [] },
    ]);

    const progressByModule = new Map(progressResult.rows.map((progress) => [progress.module_id, progress]));
    const lessonsByModule = new Map();
    for (const lesson of lessonResult.rows) {
        const lessons = lessonsByModule.get(lesson.module_id) || [];
        lessons.push({
            id: lesson.id,
            order: lesson.lesson_order,
            title: lesson.title,
            content: lesson.content,
        });
        lessonsByModule.set(lesson.module_id, lessons);
    }
    const exercisesByModule = new Map();
    for (const exercise of exerciseResult.rows) {
        const exercises = exercisesByModule.get(exercise.module_id) || [];
        exercises.push({
            id: exercise.id,
            title: exercise.title,
            instructions: exercise.instructions,
        });
        exercisesByModule.set(exercise.module_id, exercises);
    }
    const attemptsByAssessment = new Map(attemptResult.rows.map((attempt) => [attempt.assessment_id, {
        score: attempt.score,
        passed: attempt.passed,
        attemptedAt: attempt.attempted_at,
    }]));
    const assessments = assessmentResult.rows.map((assessment) => ({
        id: assessment.id,
        moduleId: assessment.module_id,
        type: assessment.assessment_type,
        title: assessment.title,
        passScore: assessment.pass_score,
        questions: getArray(assessment.questions).map((question, index) => ({
            id: `${assessment.id}-${index}`,
            prompt: question.prompt,
            options: question.options,
        })),
        latestAttempt: attemptsByAssessment.get(assessment.id) || null,
    }));

    return {
        id: roadmap.id,
        resumeId: roadmap.resume_id,
        targetRole: roadmap.target_role,
        title: roadmap.title,
        overview: roadmap.overview,
        existingSkills: getArray(roadmap.existing_skills),
        skillGaps: getArray(roadmap.skill_gaps),
        status: roadmap.status,
        createdAt: roadmap.created_at,
        updatedAt: roadmap.updated_at,
        modules: moduleResult.rows.map((module) => {
            const progress = progressByModule.get(module.id);
            return {
                id: module.id,
                order: module.module_order,
                title: module.title,
                skill: module.skill,
                description: module.description,
                lessons: lessonsByModule.get(module.id) || [],
                exercises: exercisesByModule.get(module.id) || [],
                progress: progress ? {
                    completedLessons: getArray(progress.completed_lessons),
                    completedExercises: getArray(progress.completed_exercises),
                    mastered: progress.mastered,
                } : {
                    completedLessons: [],
                    completedExercises: [],
                    mastered: false,
                },
                assessment: assessments.find((assessment) => assessment.moduleId === module.id) || null,
            };
        }),
        finalAssessment: assessments.find((assessment) => assessment.type === "final") || null,
        projects: projectResult.rows.map((project) => ({
            id: project.id,
            title: project.title,
            description: project.description,
            requirements: getArray(project.requirements),
            status: project.status,
        })),
    };
}

async function getOwnedModule(userId, roadmapId, moduleId) {
    const result = await pool.query(
        `SELECT m.id, m.module_order, r.id AS roadmap_id, r.status AS roadmap_status
         FROM learning_modules m
         JOIN learning_roadmaps r ON r.id = m.roadmap_id
         WHERE m.id = $1 AND r.id = $2 AND r.user_id = $3`,
        [moduleId, roadmapId, userId]
    );
    return result.rows[0] || null;
}

async function moduleIsUnlocked(userId, roadmapId, moduleOrder) {
    if (moduleOrder === 1) return true;
    const result = await pool.query(
        `SELECT COUNT(*)::int AS unmastered
         FROM learning_modules m
         LEFT JOIN user_learning_progress p ON p.module_id = m.id AND p.user_id = $1
         WHERE m.roadmap_id = $2 AND m.module_order < $3 AND COALESCE(p.mastered, FALSE) = FALSE`,
        [userId, roadmapId, moduleOrder]
    );
    return result.rows[0].unmastered === 0;
}

function validateTargetRole(value) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 120) {
        const error = new Error("Enter a target job role (up to 120 characters).");
        error.status = 400;
        throw error;
    }
    return value.trim();
}

export async function getLearningRoadmap(req, res) {
    try {
        const roadmap = await loadRoadmap(req.user.id);
        return res.json({ success: true, roadmap });
    } catch (error) {
        console.error("Loading learning roadmap failed:", error);
        return res.status(500).json({ success: false, message: "Could not load your learning roadmap." });
    }
}

export async function getLearningResumeContext(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, filename, parsed_json
             FROM resumes
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT 1`,
            [req.user.id]
        );
        if (!result.rows.length) return res.json({ success: true, resume: null });

        const row = result.rows[0];
        const parsed = row.parsed_json || {};
        return res.json({
            success: true,
            resume: {
                id: row.id,
                filename: row.filename,
                title: typeof parsed.title === "string" ? parsed.title : "",
                skills: getArray(parsed.skills).filter((skill) => typeof skill === "string"),
                missingSkills: getArray(parsed.metrics?.missingSkills)
                    .filter((skill) => typeof skill === "string"),
            },
        });
    } catch (error) {
        console.error("Loading resume context for learning failed:", error);
        return res.status(500).json({ success: false, message: "Could not load resume data for your learning roadmap." });
    }
}

export async function createLearningRoadmap(req, res) {
    let client;
    let transactionStarted = false;
    try {
        const targetRole = validateTargetRole(req.body?.targetRole);
        const resumeResult = await pool.query(
            `SELECT id, parsed_json FROM resumes
             WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`,
            [req.user.id]
        );
        if (!resumeResult.rows.length) {
            return res.status(409).json({
                success: false,
                message: "Analyze a resume before generating a personalized learning roadmap.",
                code: "RESUME_REQUIRED",
            });
        }

        const resume = resumeResult.rows[0];
        const parsed = resume.parsed_json || {};
        const existingSkills = getArray(parsed.skills).filter((skill) => typeof skill === "string");
        const missingSkills = getArray(parsed.metrics?.missingSkills)
            .filter((skill) => typeof skill === "string");
        const roadmap = await generateLearningRoadmap({ targetRole, existingSkills, missingSkills });

        client = await pool.connect();
        await client.query("BEGIN");
        transactionStarted = true;
        const roadmapResult = await client.query(
            `INSERT INTO learning_roadmaps
                (user_id, resume_id, target_role, title, overview, existing_skills, skill_gaps)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [req.user.id, resume.id, targetRole, roadmap.title, roadmap.overview, existingSkills, roadmap.skillGaps]
        );
        const roadmapId = roadmapResult.rows[0].id;

        for (const [moduleIndex, module] of roadmap.modules.entries()) {
            const moduleResult = await client.query(
                `INSERT INTO learning_modules (roadmap_id, module_order, title, skill, description)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [roadmapId, moduleIndex + 1, module.title, module.skill, module.description]
            );
            const moduleId = moduleResult.rows[0].id;
            await client.query(
                `INSERT INTO user_learning_progress (user_id, roadmap_id, module_id)
                 VALUES ($1, $2, $3)`,
                [req.user.id, roadmapId, moduleId]
            );
            for (const [lessonIndex, lesson] of module.lessons.entries()) {
                await client.query(
                    `INSERT INTO learning_lessons (module_id, lesson_order, title, content)
                     VALUES ($1, $2, $3, $4)`,
                    [moduleId, lessonIndex + 1, lesson.title, lesson.content]
                );
            }
            for (const exercise of module.exercises) {
                await client.query(
                    `INSERT INTO learning_exercises (module_id, title, instructions) VALUES ($1, $2, $3)`,
                    [moduleId, exercise.title, exercise.instructions]
                );
            }
            await client.query(
                `INSERT INTO learning_assessments (roadmap_id, module_id, title, assessment_type, questions)
                 VALUES ($1, $2, $3, 'module', $4::jsonb)`,
                [roadmapId, moduleId, `${module.title} assessment`, JSON.stringify(module.questions)]
            );
        }
        await client.query(
            `INSERT INTO learning_assessments (roadmap_id, title, assessment_type, questions)
             VALUES ($1, $2, 'final', $3::jsonb)`,
            [roadmapId, `${targetRole} final assessment`, JSON.stringify(roadmap.finalQuestions)]
        );
        await client.query(
            `INSERT INTO learning_projects (roadmap_id, title, description, requirements)
             VALUES ($1, $2, $3, $4::jsonb)`,
            [roadmapId, roadmap.project.title, roadmap.project.description, JSON.stringify(roadmap.project.requirements)]
        );
        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({ success: true, roadmap: await loadRoadmap(req.user.id, roadmapId) });
    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rolling back learning roadmap creation failed:", rollbackError);
            }
        }
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message, code: error.code });
        }
        console.error("Generating learning roadmap failed:", error);
        return res.status(502).json({
            success: false,
            message: "Could not generate the learning roadmap. Please retry.",
            code: "LEARNING_ROADMAP_GENERATION_FAILED",
        });
    } finally {
        client?.release();
    }
}

export async function completeLesson(req, res) {
    try {
        const module = await getOwnedModule(req.user.id, req.params.roadmapId, req.params.moduleId);
        if (!module) return res.status(404).json({ success: false, message: "Learning module was not found." });
        if (module.roadmap_status !== "active" || !(await moduleIsUnlocked(req.user.id, module.roadmap_id, module.module_order))) {
            return res.status(409).json({ success: false, message: "Complete the previous module before continuing." });
        }
        const lessonResult = await pool.query(
            "SELECT id FROM learning_lessons WHERE id = $1 AND module_id = $2",
            [req.params.lessonId, module.id]
        );
        if (!lessonResult.rows.length) return res.status(404).json({ success: false, message: "Lesson was not found." });

        await pool.query(
            `UPDATE user_learning_progress
             SET completed_lessons = CASE
                    WHEN $3::uuid = ANY(completed_lessons) THEN completed_lessons
                    ELSE array_append(completed_lessons, $3::uuid)
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND roadmap_id = $2 AND module_id = $4`,
            [req.user.id, module.roadmap_id, lessonResult.rows[0].id, module.id]
        );
        return res.json({ success: true, roadmap: await loadRoadmap(req.user.id, module.roadmap_id) });
    } catch (error) {
        console.error("Updating lesson progress failed:", error);
        return res.status(500).json({ success: false, message: "Could not update lesson progress." });
    }
}

export async function completeExercise(req, res) {
    try {
        const module = await getOwnedModule(req.user.id, req.params.roadmapId, req.params.moduleId);
        if (!module) return res.status(404).json({ success: false, message: "Learning module was not found." });
        if (module.roadmap_status !== "active" || !(await moduleIsUnlocked(req.user.id, module.roadmap_id, module.module_order))) {
            return res.status(409).json({ success: false, message: "Complete the previous module before continuing." });
        }
        const exerciseResult = await pool.query(
            "SELECT id FROM learning_exercises WHERE id = $1 AND module_id = $2",
            [req.params.exerciseId, module.id]
        );
        if (!exerciseResult.rows.length) return res.status(404).json({ success: false, message: "Exercise was not found." });

        const lessonProgress = await pool.query(
            `SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE l.id = ANY(p.completed_lessons))::int AS completed
             FROM learning_lessons l
             JOIN user_learning_progress p ON p.module_id = l.module_id AND p.user_id = $1
             WHERE l.module_id = $2`,
            [req.user.id, module.id]
        );
        if (!lessonProgress.rows[0].total || lessonProgress.rows[0].total !== lessonProgress.rows[0].completed) {
            return res.status(409).json({ success: false, message: "Complete the module lessons before its exercises." });
        }

        await pool.query(
            `UPDATE user_learning_progress
             SET completed_exercises = CASE
                    WHEN $3::uuid = ANY(completed_exercises) THEN completed_exercises
                    ELSE array_append(completed_exercises, $3::uuid)
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND roadmap_id = $2 AND module_id = $4`,
            [req.user.id, module.roadmap_id, exerciseResult.rows[0].id, module.id]
        );
        return res.json({ success: true, roadmap: await loadRoadmap(req.user.id, module.roadmap_id) });
    } catch (error) {
        console.error("Updating exercise progress failed:", error);
        return res.status(500).json({ success: false, message: "Could not update exercise progress." });
    }
}

export async function submitAssessment(req, res) {
    try {
        const assessmentResult = await pool.query(
            `SELECT a.id, a.module_id, a.assessment_type, a.questions, a.pass_score, r.id AS roadmap_id, r.status AS roadmap_status
             FROM learning_assessments a
             JOIN learning_roadmaps r ON r.id = a.roadmap_id
             WHERE a.id = $1 AND r.id = $2 AND r.user_id = $3`,
            [req.params.assessmentId, req.params.roadmapId, req.user.id]
        );
        if (!assessmentResult.rows.length) return res.status(404).json({ success: false, message: "Assessment was not found." });
        const assessment = assessmentResult.rows[0];
        if (assessment.roadmap_status !== "active") {
            return res.status(409).json({ success: false, message: "This roadmap is already complete." });
        }

        if (assessment.assessment_type === "module") {
            const moduleResult = await getOwnedModule(req.user.id, assessment.roadmap_id, assessment.module_id);
            const moduleProgressResult = await pool.query(
                `SELECT (SELECT COUNT(*)::int FROM learning_lessons WHERE module_id = $2) AS lesson_total,
                        (SELECT COUNT(*)::int FROM learning_lessons WHERE module_id = $2 AND id = ANY(p.completed_lessons)) AS lesson_done,
                        (SELECT COUNT(*)::int FROM learning_exercises WHERE module_id = $2) AS exercise_total,
                        (SELECT COUNT(*)::int FROM learning_exercises WHERE module_id = $2 AND id = ANY(p.completed_exercises)) AS exercise_done
                 FROM user_learning_progress p
                 WHERE p.user_id = $1 AND p.module_id = $2`,
                [req.user.id, assessment.module_id]
            );
            const progress = moduleProgressResult.rows[0];
            if (!moduleResult || !progress || progress.lesson_total !== progress.lesson_done || progress.exercise_total !== progress.exercise_done) {
                return res.status(409).json({ success: false, message: "Complete all module lessons and exercises before its assessment." });
            }
            if (!(await moduleIsUnlocked(req.user.id, assessment.roadmap_id, moduleResult.module_order))) {
                return res.status(409).json({ success: false, message: "Complete the previous module before continuing." });
            }
        } else {
            const unmastered = await pool.query(
                `SELECT COUNT(*)::int AS total
                 FROM learning_modules m
                 LEFT JOIN user_learning_progress p ON p.module_id = m.id AND p.user_id = $1
                 WHERE m.roadmap_id = $2 AND COALESCE(p.mastered, FALSE) = FALSE`,
                [req.user.id, assessment.roadmap_id]
            );
            if (unmastered.rows[0].total > 0) {
                return res.status(409).json({ success: false, message: "Master every learning module before taking the final assessment." });
            }
        }

        const questions = getArray(assessment.questions);
        const answers = req.body?.answers;
        if (!Array.isArray(answers) || answers.length !== questions.length ||
            answers.some((answer, index) =>
                !Number.isInteger(answer) || answer < 0 || answer >= getArray(questions[index]?.options).length)) {
            return res.status(400).json({ success: false, message: "Submit one valid answer for every assessment question." });
        }
        const correct = questions.reduce((count, question, index) => count + (answers[index] === question.correctIndex ? 1 : 0), 0);
        const score = Math.round(correct * 100 / questions.length);
        const passed = score >= assessment.pass_score;

        const client = await pool.connect();
        let transactionStarted = false;
        try {
            await client.query("BEGIN");
            transactionStarted = true;
            await client.query(
                `INSERT INTO assessment_attempts (user_id, assessment_id, score, passed, answers)
                 VALUES ($1, $2, $3, $4, $5::jsonb)`,
                [req.user.id, assessment.id, score, passed, JSON.stringify(answers)]
            );
            if (assessment.assessment_type === "module") {
                await client.query(
                    `UPDATE user_learning_progress
                     SET mastered = mastered OR $3, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND module_id = $2`,
                    [req.user.id, assessment.module_id, passed]
                );
            } else if (passed) {
                await client.query(
                    `UPDATE learning_roadmaps SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND user_id = $2`,
                    [assessment.roadmap_id, req.user.id]
                );
            }
            await client.query("COMMIT");
            transactionStarted = false;
        } catch (error) {
            if (transactionStarted) {
                try {
                    await client.query("ROLLBACK");
                } catch (rollbackError) {
                    console.error("Rolling back assessment attempt failed:", rollbackError);
                }
            }
            throw error;
        } finally {
            client.release();
        }

        return res.json({
            success: true,
            result: { score, passed, passScore: assessment.pass_score },
            roadmap: await loadRoadmap(req.user.id, assessment.roadmap_id),
        });
    } catch (error) {
        console.error("Submitting learning assessment failed:", error);
        return res.status(500).json({ success: false, message: "Could not submit the assessment." });
    }
}

export async function updateLearningProject(req, res) {
    const { status } = req.body || {};
    if (!["in_progress", "submitted"].includes(status)) {
        return res.status(400).json({ success: false, message: "Project status must be in_progress or submitted." });
    }
    try {
        const projectResult = await pool.query(
            `SELECT p.status, r.status AS roadmap_status
             FROM learning_projects p
             JOIN learning_roadmaps r ON r.id = p.roadmap_id
             WHERE p.id = $1 AND r.id = $2 AND r.user_id = $3`,
            [req.params.projectId, req.params.roadmapId, req.user.id]
        );
        if (!projectResult.rows.length) {
            return res.status(404).json({ success: false, message: "Learning project was not found." });
        }
        const project = projectResult.rows[0];
        if (project.roadmap_status !== "active") {
            return res.status(409).json({ success: false, message: "This roadmap is already complete." });
        }
        const validTransition = project.status === status
            || (project.status === "not_started" && status === "in_progress")
            || (project.status === "in_progress" && status === "submitted");
        if (!validTransition) {
            return res.status(409).json({ success: false, message: "Start the project before submitting it." });
        }
        const result = await pool.query(
            `UPDATE learning_projects p
             SET status = $3, updated_at = CURRENT_TIMESTAMP
             FROM learning_roadmaps r
             WHERE p.id = $1 AND p.roadmap_id = r.id AND r.id = $2 AND r.user_id = $4 AND r.status = 'active'
             RETURNING p.id`,
            [req.params.projectId, req.params.roadmapId, status, req.user.id]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: "Learning project was not found." });
        return res.json({ success: true, roadmap: await loadRoadmap(req.user.id, req.params.roadmapId) });
    } catch (error) {
        console.error("Updating learning project failed:", error);
        return res.status(500).json({ success: false, message: "Could not update your project status." });
    }
}
