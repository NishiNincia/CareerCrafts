import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function ensureResumeSchema() {
    const migration = await readFile(
        path.resolve(__dirname, "..", "prisma", "resume-analysis.sql"),
        "utf8"
    );
    await pool.query(migration);
}
