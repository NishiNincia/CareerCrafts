import test from "node:test";
import assert from "node:assert/strict";
import {
    classifyJobInput,
    inferRoleExperienceLevel,
    InvalidJobContextError,
    normalizeRoleTitle,
    RESUME_ANALYSIS_MODES,
} from "./resumeJobContext.js";

test("classifies a detailed Data Analyst Intern description as employer-specific", () => {
    const context = classifyJobInput({
        jobDescription: `Data Analyst Intern
Responsibilities: build dashboards and analyze product performance.
Requirements: SQL proficiency, Python experience, and a bachelor's degree.`,
    });

    assert.equal(context.mode, RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION);
});

test("classifies supported role titles without treating every short input as a title", () => {
    for (const roleTitle of [
        "Data Analyst Intern",
        "Machine Learning Engineer",
        "Full Stack Developer Intern",
    ]) {
        assert.equal(classifyJobInput({ jobDescription: roleTitle }).mode, RESUME_ANALYSIS_MODES.ROLE_ONLY);
    }
    assert.equal(normalizeRoleTitle("  Data Analyst   Intern "), "data analyst intern");
    assert.equal(inferRoleExperienceLevel("Data Analyst Intern", "Advanced"), "Beginner");
    assert.equal(inferRoleExperienceLevel("Machine Learning Engineer", "Intermediate"), "Intermediate");
    assert.throws(() => classifyJobInput({ jobDescription: "Hiring Now" }), InvalidJobContextError);
});

test("classifies an explicit job title and an empty context", () => {
    assert.equal(
        classifyJobInput({ jobTitle: "Python Developer" }).mode,
        RESUME_ANALYSIS_MODES.ROLE_ONLY
    );
    assert.equal(
        classifyJobInput({ jobDescription: "", jobId: "" }).mode,
        RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT
    );
    assert.equal(
        classifyJobInput({ jobId: "job-123", jobTitle: "Data Analyst Intern" }).mode,
        RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION
    );
});
