import test from "node:test";
import assert from "node:assert/strict";
import {
    createGeminiAnalyzer,
    createRoleCompetencyGenerator,
    geminiAnalysisConfig,
    GeminiAnalysisError,
} from "./geminiService.js";

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

function validRoleProfile() {
    return {
        expectedExperienceLevel: "Entry-level candidates commonly demonstrate foundational analysis experience.",
        technicalSkills: ["SQL", "Python"],
        coreCompetencies: ["Data interpretation"],
        toolsAndFrameworks: ["Excel", "Tableau"],
        educationalExpectations: ["Statistics or a related field"],
        typicalResponsibilities: ["Prepare reports from structured data"],
        competencies: [
            {
                skillName: "SQL",
                category: "technical skill",
                importance: "Critical",
                description: "Query structured datasets.",
                relevanceReason: "Commonly used to retrieve and validate business data.",
                expectation: "essential",
            },
            {
                skillName: "Data interpretation",
                category: "core competency",
                importance: "High",
                description: "Summarize patterns in analyzed data.",
                relevanceReason: "Supports accurate recommendations from analysis.",
                expectation: "essential",
            },
            {
                skillName: "Tableau",
                category: "tool/framework",
                importance: "Medium",
                description: "Create interactive data visualizations.",
                relevanceReason: "Common in reporting and dashboard workflows.",
                expectation: "preferred",
            },
        ],
    };
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
    assert.equal(request.config.responseJsonSchema, undefined);
    assert.equal(request.config.maxOutputTokens, 6_144);
    assert.equal(request.config.temperature, 0.2);
    assert.deepEqual(request.config.thinkingConfig, { thinkingLevel: "low" });
    assert.equal(request.config.httpOptions.timeout, 45_000);
    assert.equal(request.config.httpOptions.retryOptions, undefined);
});

test("Gemini analyzer fills missing keyword analysis groups with empty arrays", async () => {
    const analyze = createGeminiAnalyzer({
        generateContent: async () => response(validPayload({
            keywordAnalysis: { present: ["Python"] },
        })),
        maxAttempts: 1,
    });

    const profile = await analyze({ resumeText: "Python engineer" });

    assert.deepEqual(profile.keywordAnalysis, {
        present: ["Python"],
        missingImportant: [],
        presentWithoutEvidence: [],
        shouldHighlight: [],
        requireAcquisition: [],
    });
});

test("Gemini accepts a resume profile containing education and skills without a summary or project", async () => {
    const analyze = createGeminiAnalyzer({
        generateContent: async () => response(validPayload({
            professionalSummary: "",
            experienceSummaries: [],
            projectSummaries: [],
            education: [{ degree: "B.S. Computer Science", school: "State University", year: "2025" }],
            skills: { technical: ["JavaScript"], tools: [], soft: [] },
        })),
        maxAttempts: 1,
    });

    const profile = await analyze({ resumeText: "Education and skills section" });

    assert.equal(profile.professionalSummary, null);
    assert.equal(profile.education.length, 1);
    assert.deepEqual(profile.skills.technical, ["JavaScript"]);
});

test("Gemini rejects a profile with no usable resume content", async () => {
    const analyze = createGeminiAnalyzer({
        generateContent: async () => response({
            professionalSummary: "",
            experienceSummaries: [],
            education: [],
            projectSummaries: [],
            skills: { technical: [], tools: [], soft: [] },
            certifications: [],
        }),
        maxAttempts: 1,
    });

    await assert.rejects(
        analyze({ resumeText: "Resume text that could not be understood" }),
        (error) => error instanceof GeminiAnalysisError && error.code === "GEMINI_EMPTY_ANALYSIS"
    );
});

test("Gemini analyzer extracts JSON from a fenced or prefaced response", async () => {
    const payload = validPayload();
    const analyze = createGeminiAnalyzer({
        generateContent: async () => ({
            text: `Analysis result:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
        }),
        maxAttempts: 1,
    });

    const profile = await analyze({ resumeText: "Data scientist" });

    assert.equal(profile.professionalSummary, payload.professionalSummary);
});

test("role competency generation validates a generic profile and caches normalized role plus experience level", async () => {
    let calls = 0;
    const cache = new Map();
    const generateProfile = createRoleCompetencyGenerator({
        generateContent: async (request) => {
            calls += 1;
            assert.equal(request.config.responseMimeType, "application/json");
            assert.equal(request.config.responseJsonSchema, undefined);
            assert.match(request.contents[0].parts[0].text, /inferred common expectations/);
            return response(validRoleProfile());
        },
        model: "gemini-primary",
        fallbackModel: "gemini-fallback",
        cache,
        now: () => 1_000,
        sleep: async () => {},
    });

    const first = await generateProfile({ roleTitle: "Data Analyst Intern", experienceLevel: "Beginner" });
    const normalizedCacheHit = await generateProfile({ roleTitle: "  data analyst  intern ", experienceLevel: "Beginner" });
    const differentLevel = await generateProfile({ roleTitle: "Data Analyst Intern", experienceLevel: "Intermediate" });

    assert.equal(first.competencies[0].skillId, "sql");
    assert.equal(first.competencies[0].matchStatus, undefined);
    assert.equal(normalizedCacheHit.roleTitle, "Data Analyst Intern");
    assert.equal(differentLevel.experienceLevel, "Intermediate");
    assert.equal(calls, 2);
});

test("role competency profile validation rejects profiles without sufficient competencies", async () => {
    const generateProfile = createRoleCompetencyGenerator({
        generateContent: async () => response({ competencies: [] }),
        maxAttempts: 1,
        fallbackModel: geminiAnalysisConfig.model,
    });
    await assert.rejects(
        generateProfile({ roleTitle: "Machine Learning Engineer" }),
        (error) => error.code === "GEMINI_INVALID_ROLE_PROFILE"
    );
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

test("Gemini analyzer retries malformed JSON with the fallback model", async () => {
    const models = [];
    const analyze = createGeminiAnalyzer({
        generateContent: async (request) => {
            models.push(request.model);
            return models.length === 1 ? { text: "{not json}" } : response(validPayload());
        },
        sleep: async () => {},
        maxAttempts: 2,
        retryBudgetMs: 5_000,
        requestTimeoutMs: 1_000,
        model: "gemini-primary",
        fallbackModel: "gemini-fallback",
    });

    const profile = await analyze({ resumeText: "Data analyst" });

    assert.deepEqual(models, ["gemini-primary", "gemini-fallback"]);
    assert.equal(profile.analysisModel, "gemini-fallback");
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
