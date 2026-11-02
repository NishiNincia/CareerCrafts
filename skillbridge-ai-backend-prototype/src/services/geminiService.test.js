import test from "node:test";
import assert from "node:assert/strict";
import { createGeminiAnalyzer, geminiAnalysisConfig, GeminiAnalysisError } from "./geminiService.js";

function validPayload(overrides = {}) {
    return {
        professionalSummary: "Data scientist with experience building image classifiers.",
        experienceSummaries: [],
        education: [],
        projectSummaries: [
            {
                name: "Image classifier",
                summary: "Built and evaluated a CNN.",
                technologies: ["Python", "TensorFlow"],
                outcomes: ["Reduced overfitting through augmentation."],
            },
        ],
        skills: { technical: ["Python"], tools: ["TensorFlow"], soft: [] },
        certifications: [],
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
        careerFocus: "Machine learning",
        missingKeywords: ["model deployment"],
        ...overrides,
    };
}

function response(payload) {
    return { text: JSON.stringify(payload) };
}

test("configured timeout and retry budget cover two long attempts and backoff", () => {
    assert.ok(geminiAnalysisConfig.requestTimeoutMs >= 1_000);
    assert.ok(geminiAnalysisConfig.requestTimeoutMs <= 60_000);
    assert.ok(geminiAnalysisConfig.retryBudgetMs >= geminiAnalysisConfig.minRetryBudgetMs);
    assert.ok(geminiAnalysisConfig.retryBudgetMs >= geminiAnalysisConfig.maxAttempts * geminiAnalysisConfig.requestTimeoutMs + 17_000);
});

test("Gemini analyzer validates structured output and bounds prompt, output, and timeout", async () => {
    let request;
    const analyze = createGeminiAnalyzer({
        generateContent: async (value) => {
            request = value;
            return response(validPayload());
        },
        maxAttempts: 1,
        requestTimeoutMs: 45_000,
    });

    const profile = await analyze({
        resumeText: "Experience \r\n" + "resume line\n".repeat(4_000),
        jobDescription: "Build reliable services",
    });

    assert.equal(profile.analysisProvider, "Gemini");
    assert.equal(profile.analysisModel, geminiAnalysisConfig.model);
    assert.deepEqual(profile.skills.technical, ["Python"]);
    assert.ok(request.contents[0].parts[0].text.includes("JOB DESCRIPTION\nBuild reliable services"));
    assert.ok(request.contents[0].parts[0].text.length < 15_000);
    assert.equal(request.config.responseMimeType, "application/json");
    assert.equal(request.config.maxOutputTokens, 4_096);
    assert.equal(request.config.temperature, 0.2);
    assert.deepEqual(request.config.thinkingConfig, { thinkingLevel: "low" });
    assert.equal(request.config.httpOptions.timeout, 45_000);
    assert.equal(request.config.httpOptions.retryOptions, undefined);
});

test("Gemini analyzer retries 429 according to Retry-After", async () => {
    let calls = 0;
    const delays = [];
    const models = [];
    const analyze = createGeminiAnalyzer({
        generateContent: async (request) => {
            calls += 1;
            models.push(request.model);
            if (calls === 1) {
                const error = new Error("quota rate limit");
                error.status = 429;
                error.responseInternal = { headers: new Headers({ "retry-after": "2" }) };
                throw error;
            }
            return response(validPayload());
        },
        sleep: async (ms) => delays.push(ms),
        maxAttempts: 2,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 5_000,
    });

    await analyze({ resumeText: "Python engineer" });
    assert.equal(calls, 2);
    assert.deepEqual(delays, [2_000]);
    assert.deepEqual(models, [geminiAnalysisConfig.model, geminiAnalysisConfig.fallbackModel]);
});

test("Gemini analyzer recovers provider status from retryable SDK error messages", async () => {
    let calls = 0;
    const models = [];
    const analyze = createGeminiAnalyzer({
        generateContent: async (request) => {
            calls += 1;
            models.push(request.model);
            if (calls === 1) throw new Error("Retryable HTTP Error: Gateway Timeout");
            return response(validPayload());
        },
        sleep: async () => {},
        maxAttempts: 2,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 5_000,
        fallbackModel: "gemini-3.5-flash",
    });

    const profile = await analyze({ resumeText: "Data analyst" });
    assert.equal(calls, 2);
    assert.deepEqual(models, [geminiAnalysisConfig.model, "gemini-3.5-flash"]);
    assert.equal(profile.analysisModel, "gemini-3.5-flash");
});

test("Gemini analyzer retries ECONNRESET on the fallback and preserves network diagnostics", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            if (calls === 1) {
                const error = new Error("fetch failed");
                error.cause = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
                throw error;
            }
            return response(validPayload());
        },
        sleep: async () => {},
        maxAttempts: 2,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 5_000,
        fallbackModel: "gemini-3.5-flash",
    });

    const profile = await analyze({ resumeText: "Data analyst" });
    assert.equal(profile.analysisModel, "gemini-3.5-flash");
    assert.equal(calls, 2);
});

test("Gemini analyzer retries provider 504 and preserves its status on exhaustion", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            throw Object.assign(new Error("Deadline expired before operation could complete."), { status: 504 });
        },
        sleep: async () => {},
        maxAttempts: 2,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 5_000,
    });

    await assert.rejects(
        analyze({ resumeText: "Data analyst" }),
        (error) => error instanceof GeminiAnalysisError
            && error.code === "GEMINI_TIMEOUT"
            && error.diagnosticMessage.includes("origin=provider_http")
            && error.diagnosticMessage.includes("httpStatus=504")
    );
    assert.equal(calls, 2);
});

test("Gemini analyzer falls back to the configured model after a primary 404", async () => {
    const models = [];
    const analyze = createGeminiAnalyzer({
        generateContent: async (request) => {
            models.push(request.model);
            if (models.length === 1) throw Object.assign(new Error("Model not found"), { status: 404 });
            return response(validPayload());
        },
        sleep: async () => {},
        maxAttempts: 2,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 5_000,
        model: "gemini-missing-model",
        fallbackModel: "gemini-3.5-flash",
    });

    const profile = await analyze({ resumeText: "Data analyst" });
    assert.deepEqual(models, ["gemini-missing-model", "gemini-3.5-flash"]);
    assert.equal(profile.analysisModel, "gemini-3.5-flash");
});

test("Gemini analyzer does not retry when there is no distinct fallback model", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            throw Object.assign(new Error("Model not found"), { status: 404 });
        },
        maxAttempts: 2,
        model: "gemini-missing-model",
        fallbackModel: "gemini-missing-model",
    });

    await assert.rejects(analyze({ resumeText: "Data analyst" }), (error) => error.code === "GEMINI_UNSUPPORTED_MODEL");
    assert.equal(calls, 1);
});

test("Gemini analyzer reports truncated output as a validation failure", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            return {
                text: "{\"professionalSummary\":\"partial\"}",
                candidates: [{ finishReason: "MAX_TOKENS" }],
            };
        },
        maxAttempts: 2,
    });

    await assert.rejects(
        analyze({ resumeText: "Data analyst" }),
        (error) => error instanceof GeminiAnalysisError && error.code === "GEMINI_TRUNCATED"
    );
    assert.equal(calls, 1);
});

test("Gemini analyzer classifies a local SDK timeout separately from provider HTTP 504", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            const error = new Error("Request timed out");
            error.name = "APIConnectionTimeoutError";
            error.cause = Object.assign(new Error("connect timeout"), { code: "UND_ERR_CONNECT_TIMEOUT" });
            throw error;
        },
        sleep: async () => {},
        maxAttempts: 1,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 2_000,
    });

    await assert.rejects(
        analyze({ resumeText: "Data analyst" }),
        (error) => error instanceof GeminiAnalysisError
            && error.code === "GEMINI_TIMEOUT"
            && error.diagnosticMessage.includes("origin=client_timeout")
            && error.diagnosticMessage.includes("sdkErrorName=APIConnectionTimeoutError")
            && error.diagnosticMessage.includes("sdkErrorCode=UND_ERR_CONNECT_TIMEOUT")
            && error.diagnosticMessage.includes("httpStatus=n/a")
    );
    assert.equal(calls, 1);
});

test("Gemini analyzer sends an abort signal to the SDK", async () => {
    const abortController = new AbortController();
    let request;
    const analyze = createGeminiAnalyzer({
        generateContent: async (value) => {
            request = value;
            return response(validPayload());
        },
        maxAttempts: 1,
    });

    await analyze({ resumeText: "Data scientist", signal: abortController.signal });
    assert.equal(request.config.abortSignal, abortController.signal);
});

test("Gemini analyzer rejects malformed JSON without retrying", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            return { text: "{not json}" };
        },
        maxAttempts: 2,
    });

    await assert.rejects(
        analyze({ resumeText: "Data analyst" }),
        (error) => error.code === "GEMINI_INVALID_JSON"
    );
    assert.equal(calls, 1);
});

test("Gemini analyzer fails after bounded transient retries", async () => {
    let calls = 0;
    const analyze = createGeminiAnalyzer({
        generateContent: async () => {
            calls += 1;
            const error = new Error("Service unavailable");
            error.status = 503;
            throw error;
        },
        sleep: async () => {},
        random: () => 0,
        maxAttempts: 2,
        requestTimeoutMs: 1_000,
        retryBudgetMs: 5_000,
    });

    await assert.rejects(
        analyze({ resumeText: "Data analyst" }),
        (error) => error instanceof GeminiAnalysisError && error.code === "GEMINI_API_ERROR"
    );
    assert.equal(calls, 2);
});
