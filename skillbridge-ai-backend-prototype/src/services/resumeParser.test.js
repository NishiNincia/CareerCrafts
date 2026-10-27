import test from "node:test";
import assert from "node:assert/strict";
import { analyzeResumeText } from "./resumeParser.js";

test("extracts resume sections and classifies an experienced candidate", () => {
    const parsed = analyzeResumeText(`Aarav Sharma
Frontend Engineer
aarav@example.com

Summary
Frontend engineer with 4 years of experience building web applications.

Experience
Frontend Developer at Nova Labs | 2022 - Present
- Built React dashboards used by product teams

Education
B.Tech, IIIT Bangalore | 2018 - 2022

Skills
React, TypeScript, Git

Projects
Hiring Assistant: Built a deployed application for interview workflows.

Certifications
AWS Cloud Practitioner`);

    assert.equal(parsed.name, "Aarav Sharma");
    assert.equal(parsed.title, "Frontend Engineer");
    assert.equal(parsed.email, "aarav@example.com");
    assert.ok(parsed.yearsExperience >= 4);
    assert.equal(parsed.careerLevel, "Intermediate");
    assert.equal(parsed.experience.length, 1);
    assert.equal(parsed.experience[0].company, "Nova Labs");
    assert.deepEqual(parsed.skills, ["React", "TypeScript", "Git"]);
    assert.equal(parsed.education.length, 1);
    assert.equal(parsed.projects.length, 1);
    assert.equal(parsed.certifications[0], "AWS Cloud Practitioner");
    assert.ok(parsed.metrics.atsScore >= 0 && parsed.metrics.atsScore <= 100);
});

test("keeps a short school-project resume at beginner level", () => {
    const parsed = analyzeResumeText(`Mina Patel
Student
Education
BSc Computer Science, Example University, 2025
Skills
Java, HTML
Projects
Library Management System`);

    assert.equal(parsed.careerLevel, "Beginner");
    assert.equal(parsed.yearsExperience, 0);
});

test("promotes a candidate with a senior title or five years of experience", () => {
    const senior = analyzeResumeText(`Alex
Senior Engineer
Summary
Software engineer building internal tools.`);
    const experienced = analyzeResumeText(`Sam
Summary
5 years of experience in software development`);

    assert.equal(senior.careerLevel, "Advanced");
    assert.equal(experienced.careerLevel, "Advanced");
});

test("classifies complex independent projects as intermediate", () => {
    const parsed = analyzeResumeText(`Taylor
Projects
Independent platform: Built and deployed an end-to-end application`);
    assert.equal(parsed.careerLevel, "Intermediate");
});
