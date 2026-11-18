import test from "node:test";
import assert from "node:assert/strict";
import { createLearningRoadmapGenerator, validateRoadmapContent } from "./learningRoadmapGenerator.js";
import { geminiAnalysisConfig } from "./geminiService.js";

function question(prompt, correctIndex = 0) {
    return {
        prompt,
        options: ["Correct answer", "Incorrect answer"],
        correctIndex,
        explanation: "The first option is correct.",
    };
}

function roadmapContent() {
    return {
        title: "Frontend Engineer Roadmap",
        overview: "Build practical frontend engineering skills.",
        skillGaps: ["Accessibility"],
        modules: [{
            title: "Accessible interfaces",
            skill: "Accessibility",
            description: "Learn to build inclusive user interfaces.",
            lessons: [{ title: "Semantic HTML", content: "Use semantic elements to communicate meaning." }],
            exercises: [{ title: "Improve a form", instructions: "Add labels and keyboard support to a form." }],
            questions: [question("Which element labels an input?"), question("What does keyboard support enable?"), question("Why use semantic elements?")],
        }],
        finalQuestions: [
            question("Which change improves accessibility?"),
            question("How should a button be activated?"),
            question("What is the purpose of a label?"),
            question("How do headings help users?"),
            question("What is an accessible name?"),
        ],
        project: {
            title: "Accessible form project",
            description: "Create an inclusive multi-step form.",
            requirements: ["Support keyboard navigation", "Provide clear labels"],
        },
    };
}

test("validates a complete lesson, exercise, assessment, and project roadmap", () => {
    const result = validateRoadmapContent(roadmapContent());
    assert.equal(result.modules.length, 1);
    assert.equal(result.modules[0].lessons[0].title, "Semantic HTML");
    assert.equal(result.finalQuestions.length, 5);
    assert.deepEqual(result.project.requirements, ["Support keyboard navigation", "Provide clear labels"]);
});

test("rejects assessment questions whose correct option is out of range", () => {
    const payload = roadmapContent();
    payload.modules[0].questions[0].correctIndex = 3;
    assert.throws(() => validateRoadmapContent(payload), /correctIndex/);
});

test("generates structured roadmap content for the selected role and resume skills", async () => {
    let request;
    const generate = createLearningRoadmapGenerator({
        generateContent: async (value) => {
            request = value;
            return { text: JSON.stringify(roadmapContent()) };
        },
    });

    const result = await generate({
        targetRole: "Frontend Engineer",
        existingSkills: ["JavaScript"],
        missingSkills: ["Accessibility"],
    });

    assert.match(request.contents[0].parts[0].text, /Frontend Engineer/);
    assert.match(request.contents[0].parts[0].text, /JavaScript/);
    assert.match(request.contents[0].parts[0].text, /Accessibility/);
    assert.match(request.contents[0].parts[0].text, /correctIndex/);
    assert.equal(request.config.responseJsonSchema, undefined);
    assert.equal(request.config.responseMimeType, "application/json");
    assert.equal(request.config.maxOutputTokens, 6_000);
    assert.equal(request.config.httpOptions.timeout, 45_000);
    assert.equal(result.modules[0].skill, "Accessibility");
});

test("retries network failures with the configured fallback model", async () => {
    const requests = [];
    const generate = createLearningRoadmapGenerator({
        sleep: async () => {},
        generateContent: async (request) => {
            requests.push(request);
            if (requests.length === 1) {
                const error = new TypeError("fetch failed");
                error.cause = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
                throw error;
            }
            return { text: JSON.stringify(roadmapContent()) };
        },
    });

    await generate({ targetRole: "Frontend Engineer", existingSkills: [], missingSkills: ["Accessibility"] });

    assert.equal(requests.length, 2);
    assert.equal(requests[1].model, geminiAnalysisConfig.fallbackModel);
});

test("retries malformed JSON and returns a validated roadmap on the second attempt", async () => {
    let attempts = 0;
    const generate = createLearningRoadmapGenerator({
        sleep: async () => {},
        generateContent: async () => {
            attempts += 1;
            return { text: attempts === 1 ? "not json" : JSON.stringify(roadmapContent()) };
        },
    });

    const result = await generate({ targetRole: "Frontend Engineer", existingSkills: [], missingSkills: ["Accessibility"] });

    assert.equal(attempts, 2);
    assert.equal(result.modules.length, 1);
});

test("reports invalid model output instead of accepting an incomplete roadmap", async () => {
    let attempts = 0;
    const generate = createLearningRoadmapGenerator({
        sleep: async () => {},
        generateContent: async () => {
            attempts += 1;
            return { text: JSON.stringify({ title: "Incomplete" }) };
        },
    });
    await assert.rejects(
        () => generate({ targetRole: "Developer", existingSkills: [], missingSkills: [] }),
        (error) => {
            assert.equal(error.code, "LEARNING_ROADMAP_GENERATION_FAILED");
            assert.match(error.cause.message, /between 1 and 8 modules/);
            return true;
        },
    );
    assert.equal(attempts, 2);
});
