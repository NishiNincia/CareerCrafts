import test from "node:test";
import assert from "node:assert/strict";
import { createLearningRoadmapGenerator, validateRoadmapContent } from "./learningRoadmapGenerator.js";

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
    assert.equal(request.config.responseMimeType, "application/json");
    assert.equal(result.modules[0].skill, "Accessibility");
});

test("reports invalid model output instead of accepting an incomplete roadmap", async () => {
    const generate = createLearningRoadmapGenerator({
        generateContent: async () => ({ text: JSON.stringify({ title: "Incomplete" }) }),
    });
    await assert.rejects(
        () => generate({ targetRole: "Developer", existingSkills: [], missingSkills: [] }),
        /between 1 and 8 modules/,
    );
});
