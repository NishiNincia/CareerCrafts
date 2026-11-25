import test from "node:test";
import assert from "node:assert/strict";
import { geminiAnalysisConfig } from "./geminiService.js";
import {
    createParserFallbackProfile,
    createResumeAnalysisCacheKey,
    hasUsableParsedResume,
    resumeAnalysisWorkerConfig,
    runRoleOnlyAnalysis,
} from "./resumeAnalysisWorker.js";
import { mergeResumeAnalysis } from "./resumeAnalysis.js";
import { RESUME_ANALYSIS_MODES } from "./resumeJobContext.js";

test("worker timeout and lease cover the complete configured Gemini retry budget", () => {
    assert.ok(resumeAnalysisWorkerConfig.jobTimeoutMs >= geminiAnalysisConfig.retryBudgetMs + 15_000);
    assert.ok(resumeAnalysisWorkerConfig.leaseMs >= resumeAnalysisWorkerConfig.jobTimeoutMs + 30_000);
});

test("analysis cache key changes when primary or fallback model changes", () => {
    const input = {
        userId: "user-1",
        sourceText: "resume text",
        jobDescription: "job text",
    };
    const currentKey = createResumeAnalysisCacheKey(input);

    assert.notEqual(
        currentKey,
        createResumeAnalysisCacheKey({ ...input, fallbackModel: "gemini-3.1-flash-lite" })
    );
    assert.notEqual(
        currentKey,
        createResumeAnalysisCacheKey({ ...input, model: "gemini-3.1-flash-lite" })
    );
});

test("analysis cache key separates employer, role-only, and resume-only modes", () => {
    const input = {
        userId: "user-1",
        sourceText: "resume text",
        jobDescription: "Data Analyst Intern",
        jobTitle: "Data Analyst Intern",
    };
    const roleKey = createResumeAnalysisCacheKey({
        ...input,
        analysisMode: "ROLE_ONLY",
        normalizedRole: "data analyst intern",
    });

    assert.notEqual(roleKey, createResumeAnalysisCacheKey({
        ...input,
        analysisMode: "FULL_JOB_DESCRIPTION",
        normalizedRole: "",
    }));
    assert.notEqual(roleKey, createResumeAnalysisCacheKey({
        ...input,
        jobDescription: "",
        jobTitle: "",
        analysisMode: "NO_JOB_CONTEXT",
        normalizedRole: "",
    }));
    assert.notEqual(roleKey, createResumeAnalysisCacheKey({
        ...input,
        analysisMode: "ROLE_ONLY",
        normalizedRole: "machine learning engineer",
    }));
});

test("empty Gemini output falls back only when local parsing found multiple resume sections", () => {
    const parsedResume = {
        summary: "",
        title: "Frontend developer",
        skills: ["JavaScript", "React"],
        experience: [],
        education: [{ degree: "B.S. Computer Science", school: "State University" }],
        projects: [],
        certifications: [],
        metrics: { missingSkills: ["HTML"], missingKeywords: ["HTML"] },
        name: "Alex",
        email: "alex@example.com",
        phone: "",
        yearsExperience: 0,
        careerLevel: "Beginner",
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
    };

    assert.equal(hasUsableParsedResume(parsedResume), true);
    const fallbackProfile = createParserFallbackProfile(parsedResume);
    const merged = mergeResumeAnalysis(parsedResume, fallbackProfile, {
        mode: RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT,
    });
    assert.equal(merged.analysisProvider, "Local Resume Parser");
    assert.equal(merged.metrics.analysisMode, RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT);
    assert.equal(merged.metrics.compatibilityScore, null);
    assert.throws(
        () => createParserFallbackProfile({ skills: ["JavaScript"], experience: [], education: [], projects: [] }),
        (error) => error.code === "GEMINI_EMPTY_ANALYSIS"
    );
});

test("role-only analysis aborts the sibling Gemini request after one request fails", async () => {
    const failure = new Error("Resume analysis failed");
    let siblingAborted = false;

    await assert.rejects(
        runRoleOnlyAnalysis(
            async () => {
                throw failure;
            },
            (signal) => new Promise((resolve, reject) => {
                signal.addEventListener("abort", () => {
                    siblingAborted = true;
                    reject(new Error("Role profile request aborted"));
                }, { once: true });
            })
        ),
        (error) => error === failure
    );

    assert.equal(siblingAborted, true);
});
