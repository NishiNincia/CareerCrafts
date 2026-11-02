import test from "node:test";
import assert from "node:assert/strict";
import { mergeResumeAnalysis, scoreResumeProfile } from "./resumeAnalysis.js";

test("resume scoring uses documented section and skill-count rules", () => {
    const scores = scoreResumeProfile({
        name: "Alex",
        email: "alex@example.com",
        summary: "Engineer",
        experience: [{}],
        education: [],
        skills: ["JavaScript", "React", "react"],
        projects: [{}],
    });

    assert.deepEqual(scores, {
        atsScore: 80,
        profileCompletion: 83,
        skillStrength: 20,
        resumeScore: 69,
    });
});

test("job-specific findings are kept separate from general skill gaps", () => {
    const parsed = {
        name: "Alex",
        title: "Engineer",
        summary: "Software engineer",
        email: "",
        phone: "",
        yearsExperience: 1,
        careerLevel: "Beginner",
        education: [],
        experience: [],
        skills: ["JavaScript"],
        projects: [{ name: "App", description: "Built app" }],
        certifications: [],
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
        metrics: {
            missingKeywords: ["cloud basics"],
            missingSkills: ["cloud basics"],
        },
    };
    const profile = {
        analysisProvider: "Gemini",
        analysisModel: "gemini-3.8-flash",
        professionalSummary: "Software engineer",
        experienceSummaries: [],
        education: [],
        projectSummaries: [],
        skills: { technical: ["JavaScript"], tools: [], soft: [] },
        certifications: [],
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
        careerFocus: "Software engineering",
        missingKeywords: ["Kubernetes"],
    };

    assert.deepEqual(mergeResumeAnalysis(parsed, profile, "A Kubernetes role").metrics.missingKeywords, ["Kubernetes"]);
    assert.deepEqual(mergeResumeAnalysis(parsed, profile, "").metrics.missingKeywords, ["cloud basics"]);
});
