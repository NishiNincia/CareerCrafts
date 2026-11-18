import test from "node:test";
import assert from "node:assert/strict";
import { ensureResumeSchema } from "./resumeSchema.js";

test("applies the resume migration without PL/pgSQL and adds only missing constraints", async () => {
    const queries = [];
    const database = {
        async query(sql, values) {
            queries.push({ sql, values });
            if (sql.includes("FROM pg_constraint")) {
                return { rows: [{ conname: "resumes_career_level_check" }] };
            }
            return { rows: [] };
        },
    };

    await ensureResumeSchema(database);

    assert.match(queries[0].sql, /CREATE TABLE IF NOT EXISTS resumes/);
    assert.doesNotMatch(queries[0].sql, /\bDO\s+\$\$/i);
    assert.equal(queries[1].values[0].length, 6);

    const addedConstraints = queries.slice(2).map(({ sql }) => sql);
    assert.equal(addedConstraints.length, 5);
    assert.ok(addedConstraints.every((sql) => sql.startsWith("ALTER TABLE resumes ADD CONSTRAINT")));
    assert.ok(addedConstraints.every((sql) => !sql.includes("resumes_career_level_check")));
});
