import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESUME_CONSTRAINTS = [
    ["resumes_career_level_check", "CHECK (career_level IN ('Beginner', 'Intermediate', 'Advanced'))"],
    ["resumes_years_experience_check", "CHECK (years_experience >= 0)"],
    ["resumes_ats_score_check", "CHECK (ats_score BETWEEN 0 AND 100)"],
    ["resumes_resume_score_check", "CHECK (resume_score BETWEEN 0 AND 100)"],
    ["resumes_profile_completion_check", "CHECK (profile_completion BETWEEN 0 AND 100)"],
    ["resumes_skill_strength_check", "CHECK (skill_strength BETWEEN 0 AND 100)"],
];

export async function ensureResumeSchema(database = pool) {
    const migration = await readFile(
        path.resolve(__dirname, "..", "prisma", "resume-analysis.sql"),
        "utf8"
    );
    await database.query(migration);

    const constraintNames = RESUME_CONSTRAINTS.map(([name]) => name);
    const { rows } = await database.query(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = 'resumes'::regclass
           AND conname = ANY($1::text[])`,
        [constraintNames]
    );
    const existingConstraints = new Set(rows.map(({ conname }) => conname));

    for (const [name, definition] of RESUME_CONSTRAINTS) {
        if (!existingConstraints.has(name)) {
            await database.query(`ALTER TABLE resumes ADD CONSTRAINT ${name} ${definition}`);
        }
    }
}
