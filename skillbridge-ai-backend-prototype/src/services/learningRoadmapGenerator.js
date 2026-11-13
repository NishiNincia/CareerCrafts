import { GoogleGenAI } from "@google/genai";
import { geminiAnalysisConfig } from "./geminiService.js";

const questionSchema = {
    type: "object",
    properties: {
        prompt: { type: "string" },
        options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
        correctIndex: { type: "integer" },
        explanation: { type: "string" },
    },
    required: ["prompt", "options", "correctIndex", "explanation"],
};

const roadmapSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        overview: { type: "string" },
        skillGaps: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
        modules: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    skill: { type: "string" },
                    description: { type: "string" },
                    lessons: {
                        type: "array",
                        minItems: 1,
                        maxItems: 4,
                        items: {
                            type: "object",
                            properties: { title: { type: "string" }, content: { type: "string" } },
                            required: ["title", "content"],
                        },
                    },
                    exercises: {
                        type: "array",
                        minItems: 1,
                        maxItems: 3,
                        items: {
                            type: "object",
                            properties: { title: { type: "string" }, instructions: { type: "string" } },
                            required: ["title", "instructions"],
                        },
                    },
                    questions: { type: "array", minItems: 3, maxItems: 6, items: questionSchema },
                },
                required: ["title", "skill", "description", "lessons", "exercises", "questions"],
            },
        },
        finalQuestions: { type: "array", minItems: 5, maxItems: 10, items: questionSchema },
        project: {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                requirements: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
            },
            required: ["title", "description", "requirements"],
        },
    },
    required: ["title", "overview", "skillGaps", "modules", "finalQuestions", "project"],
};

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

export function createLearningRoadmapGenerator({ generateContent } = {}) {
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
Use the learner's current skills and resume skill gaps to choose the next topics. Do not rely on or refer to a course catalog. Generate original, concise lesson text and actionable practice exercises. Each module should have 1-4 lessons, 1-3 exercises, and 3-6 multiple-choice assessment questions. Add a final assessment with 5-10 questions and one portfolio project. Every question must have one unambiguous correct option and a short explanation. Do not assume the learner already knows a listed skill.

Current skills: ${JSON.stringify(existingSkills)}
Resume skill gaps: ${JSON.stringify(missingSkills)}`;
        const response = await generate({
            model: geminiAnalysisConfig.model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: roadmapSchema,
                maxOutputTokens: 10_000,
                temperature: 0.3,
                httpOptions: { timeout: 60_000 },
            },
        });
        const responseText = typeof response?.text === "string"
            ? response.text.trim()
            : response?.candidates?.flatMap((candidate) => candidate?.content?.parts || [])
                .map((part) => part?.text)
                .filter((part) => typeof part === "string")
                .join("\n")
                .trim();
        if (!responseText) throw new Error("Gemini returned an empty learning roadmap.");

        let payload;
        try {
            payload = JSON.parse(responseText);
        } catch {
            throw new Error("Gemini returned invalid JSON for the learning roadmap.");
        }
        return validateRoadmapContent(payload);
    };
}

export const generateLearningRoadmap = createLearningRoadmapGenerator();
