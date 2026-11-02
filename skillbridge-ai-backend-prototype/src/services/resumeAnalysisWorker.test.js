import test from "node:test";
import assert from "node:assert/strict";
import { geminiAnalysisConfig } from "./geminiService.js";
import { createResumeAnalysisCacheKey, resumeAnalysisWorkerConfig } from "./resumeAnalysisWorker.js";

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
