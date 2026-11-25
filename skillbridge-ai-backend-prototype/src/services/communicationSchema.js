import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function ensureCommunicationSchema(pool) {
    const migration = await readFile(
        path.resolve(__dirname, "..", "prisma", "notifications-chat.sql"),
        "utf8"
    );
    await pool.query(migration);
}
