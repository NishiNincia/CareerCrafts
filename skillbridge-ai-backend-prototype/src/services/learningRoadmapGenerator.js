import { GoogleGenAI } from "@google/genai";
import { geminiAnalysisConfig } from "./geminiService.js";

const MAX_ATTEMPTS = 2;
const REQUEST_TIMEOUT_MS = 45_000;

class InvalidRoadmapOutputError extends Error {}

function getProviderStatus(error) {
    const status = Number(error?.status || error?.responseInternal?.status || error?.response?.status);
    if (Number.isFinite(status) && status > 0) return status;
    const message = String(error?.message || "");
    if (/too many requests|rate limit/i.test(message)) return 429;
    if (/gateway timeout/i.test(message)) return 504;
    if (/service unavailable/i.test(message)) return 503;
    return 0;
}

function isRetryableError(error, status) {
    if ([429, 500, 502, 503, 504].includes(status)) return true;
    if (status) return false;
    const code = String(error?.code || error?.cause?.code || "");
    return error?.name === "AbortError"
        || error?.name === "TypeError"
        || /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|UND_ERR_CONNECT_TIMEOUT/i.test(code)
        || /timeout|aborted|fetch failed/i.test(String(error?.message || ""));
}

function getResponseText(response) {
    if (typeof response?.text === "string") return response.text.trim();
    return response?.candidates
        ?.flatMap((candidate) => candidate?.content?.parts || [])
        .map((part) => part?.text)
        .filter((part) => typeof part === "string")
        .join("\n")
        .trim() || "";
}

function parseResponse(response) {
    if (response?.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        throw new InvalidRoadmapOutputError("Gemini truncated the learning roadmap response.");
    }
    const responseText = getResponseText(response).replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
    if (!responseText) throw new InvalidRoadmapOutputError("Gemini returned an empty learning roadmap.");

    let payload;
    try {
        payload = JSON.parse(responseText);
    } catch {
        throw new InvalidRoadmapOutputError("Gemini returned invalid JSON for the learning roadmap.");
    }
    try {
        return validateRoadmapContent(payload);
    } catch (error) {
        throw new InvalidRoadmapOutputError(error.message, { cause: error });
    }
}

function readText(value, field, maxLength = 4000) {
    if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
        throw new Error(`Generated roadmap has an invalid ${field}.`);
    }
    return value.trim();
}

function readStringArray(value, field, minItems, maxItems) {
    if (!Array.isArray(value) || value.length < minItems || value.length > maxItems) {
        throw new Error(`Generated roadmap has an invalid ${field}.`);
    }
    return value.map((item, index) => readText(item, `${field}[${index}]`, 1000));
}

function validateQuestion(question, field) {
    const options = readStringArray(question?.options, `${field}.options`, 2, 5);
    if (!Number.isInteger(question?.correctIndex) || question.correctIndex < 0 || question.correctIndex >= options.length) {
        throw new Error(`Generated roadmap has an invalid ${field}.correctIndex.`);
    }
    return {
        prompt: readText(question.prompt, `${field}.prompt`),
        options,
        correctIndex: question.correctIndex,
        explanation: readText(question.explanation, `${field}.explanation`),
    };
}

export function validateRoadmapContent(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Gemini returned an invalid learning roadmap.");
    }
    if (!Array.isArray(payload.modules) || payload.modules.length < 1 || payload.modules.length > 8) {
        throw new Error("Generated roadmap must contain between 1 and 8 modules.");
    }
    const skillGaps = readStringArray(payload.skillGaps, "skillGaps", 1, 8);
    const modules = payload.modules.map((module, index) => {
        const field = `modules[${index}]`;
        if (!Array.isArray(module.lessons) || module.lessons.length < 1 || module.lessons.length > 4) {
            throw new Error(`Generated roadmap has an invalid ${field}.lessons.`);
        }
        if (!Array.isArray(module.exercises) || module.exercises.length < 1 || module.exercises.length > 3) {
            throw new Error(`Generated roadmap has an invalid ${field}.exercises.`);
        }
        if (!Array.isArray(module.questions) || module.questions.length < 3 || module.questions.length > 6) {
            throw new Error(`Generated roadmap has an invalid ${field}.questions.`);
        }
        return {
            title: readText(module.title, `${field}.title`, 200),
            skill: readText(module.skill, `${field}.skill`, 200),
            description: readText(module.description, `${field}.description`),
            lessons: module.lessons.map((lesson, lessonIndex) => ({
                title: readText(lesson.title, `${field}.lessons[${lessonIndex}].title`, 200),
                content: readText(lesson.content, `${field}.lessons[${lessonIndex}].content`),
            })),
            exercises: module.exercises.map((exercise, exerciseIndex) => ({
                title: readText(exercise.title, `${field}.exercises[${exerciseIndex}].title`, 200),
                instructions: readText(exercise.instructions, `${field}.exercises[${exerciseIndex}].instructions`),
            })),
            questions: module.questions.map((question, questionIndex) =>
                validateQuestion(question, `${field}.questions[${questionIndex}]`)),
        };
    });
    if (!Array.isArray(payload.finalQuestions) || payload.finalQuestions.length < 5 || payload.finalQuestions.length > 10) {
        throw new Error("Generated roadmap has an invalid final assessment.");
    }
    const requirements = readStringArray(payload.project?.requirements, "project.requirements", 2, 8);
    return {
        title: readText(payload.title, "title", 200),
        overview: readText(payload.overview, "overview"),
        skillGaps,
        modules,
        finalQuestions: payload.finalQuestions.map((question, index) =>
            validateQuestion(question, `finalQuestions[${index}]`)),
        project: {
            title: readText(payload.project.title, "project.title", 200),
            description: readText(payload.project.description, "project.description"),
            requirements,
        },
    };
}

export function createLearningRoadmapGenerator({
    generateContent,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
    const generate = generateContent ?? ((request) => {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            const error = new Error("Gemini is not configured. Set GEMINI_API_KEY to generate learning roadmaps.");
            error.status = 503;
            error.code = "GEMINI_INVALID_CONFIGURATION";
            throw error;
        }
        return new GoogleGenAI({ apiKey }).models.generateContent(request);
    });

    return async function generateLearningRoadmap({ targetRole, existingSkills, missingSkills }) {
        const prompt = `Create a practical, role-specific learning roadmap for "${targetRole}".
Use the learner's current skills and resume skill gaps to choose the next topics. Do not rely on or refer to a course catalog. Generate original, concise lesson text and actionable practice exercises. Create 3 modules. Each module must have 1 lesson, 1 exercise, and 3 multiple-choice assessment questions. Add a final assessment with 5 questions and one portfolio project. Every question must have one unambiguous correct option and a short explanation. Do not assume the learner already knows a listed skill.

Return only a JSON object with title, overview, skillGaps (string array), modules (array of objects with title, skill, description, lessons, exercises, and questions), finalQuestions, and project (object with title, description, and requirements string array). Each lesson must have title and content. Each exercise must have title and instructions. Each question must have prompt, options (string array), correctIndex (zero-based integer), and explanation. Do not include Markdown or extra fields.

Current skills: ${JSON.stringify(existingSkills)}
Resume skill gaps: ${JSON.stringify(missingSkills)}`;

        let lastError;
        let lastStatus = 0;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            const model = attempt === 1 ? geminiAnalysisConfig.model : geminiAnalysisConfig.fallbackModel;
            try {
                const response = await generate({
                    model,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        maxOutputTokens: 6_000,
                        temperature: 0.2,
                        ...(/^gemini-3(?:\.|-)/i.test(model) ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
                        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
                    },
                });
                return parseResponse(response);
            } catch (error) {
                lastError = error;
                const status = getProviderStatus(error);
                lastStatus = status;
                const canRetry = attempt < MAX_ATTEMPTS
                    && (error instanceof InvalidRoadmapOutputError || isRetryableError(error, status));
                if (!canRetry) break;
                console.warn(
                    `[Learning] Roadmap generation failed model=${model} attempt=${attempt}/${MAX_ATTEMPTS} status=${status || "n/a"} code=${error?.code || error?.cause?.code || "n/a"}; retrying`
                );
                await sleep(500);
            }
        }

        const error = new Error("Could not generate a valid learning roadmap. Please retry.");
        error.status = lastStatus === 429 ? 429 : 502;
        error.code = lastStatus === 429 ? "GEMINI_QUOTA_LIMIT" : "LEARNING_ROADMAP_GENERATION_FAILED";
        error.cause = lastError;
        throw error;
    };
}

export const generateLearningRoadmap = createLearningRoadmapGenerator();
