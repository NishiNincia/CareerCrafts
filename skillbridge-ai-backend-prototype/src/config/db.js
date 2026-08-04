import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { Pool } = pkg;

function normalizeEnvValue(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().replace(/^['"]|['"]$/g, "");
}

const pool = new Pool({
    host: normalizeEnvValue(process.env.DB_HOST),
    port: Number(process.env.DB_PORT || 5432),
    database: normalizeEnvValue(process.env.DB_NAME),
    user: normalizeEnvValue(process.env.DB_USER),
    password: normalizeEnvValue(process.env.DB_PASSWORD),
});

export default pool;