import test from "node:test";
import assert from "node:assert/strict";
import {
    calculateCompatibilityScore,
    calculateStructureScore,
    mergeResumeAnalysis,
    normalizeSkillId,
    scoreResumeProfile,
} from "./resumeAnalysis.js";
import { RESUME_ANALYSIS_MODES } from "./resumeJobContext.js";

function parsedResume(overrides = {}) {
    return {
        name: "Alex",
        title: "Data analyst",
        summary: "Early-career analyst",
        email: "alex@example.com",
        phone: "",
        yearsExperience: 1,
        careerLevel: "Beginner",
        education: [{ degree: "B.S. Computer Science", school: "State University", year: "2025" }],
        experience: [{ role: "Data Analyst Intern", company: "Example", period: "2024 - 2025", bullets: ["Prepared weekly reports with SQL."] }],
        skills: ["SQL", "Python"],
        projects: [{ name: "Sales dashboard", description: "Analyzed sales data with SQL.", technologies: ["SQL"], outcomes: [] }],
        certifications: [],
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
        metrics: {
            missingKeywords: ["old parser keyword"],
            missingSkills: ["Excel", "Tableau", "Python"],
        },
        ...overrides,
    };
}

function geminiProfile(overrides = {}) {
    return {
        analysisProvider: "Gemini",
        analysisModel: "gemini-test",
        professionalSummary: "Data analyst with reporting experience.",
        experienceSummaries: [],
        education: [],
        projectSummaries: [],
        skills: { technical: ["SQL", "Python"], tools: [], soft: [] },
        certifications: [],
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
        careerFocus: "Data analysis",
        missingKeywords: ["provider-generated gap must be ignored"],
        jobRequirements: [],
        improvementRecommendations: {
            formatting: ["Use consistent dates."],
            atsOptimization: [],
            experience: [],
            projects: [],
            skills: ["Learn SQL", "Build advanced SQL performance skills"],
        },
        resumeStructureAssessment: {
            sectionOrganization: { score: 100 },
            atsReadability: { score: 100 },
            formattingConsistency: { score: 80 },
            contentClarity: { score: 100 },
            experienceProjectPresentation: { score: 100 },
            contactEssentialSections: { score: 100 },
            grammarLanguage: { score: 100 },
        },
        ...overrides,
    };
}

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

test("full job descriptions keep actual employer requirements and deterministic evidence matching", () => {
    const employerRequirements = [
        { skillName: "SQL", category: "Technical", importance: "Critical", requirementType: "skill" },
        { skillName: "Tableau", category: "Tool", importance: "High", requirementType: "skill" },
        { skillName: "Bachelor's degree in Computer Science", category: "Education", importance: "Medium", requirementType: "education" },
    ];
    const profile = mergeResumeAnalysis(parsedResume(), geminiProfile({
        jobRequirements: employerRequirements,
    }), {
        mode: RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION,
    });

    assert.deepEqual(profile.metrics.jobRequirements.map(({ skillName, matchStatus }) => [skillName, matchStatus]), [
        ["SQL", "MATCHED"],
        ["Tableau", "MISSING"],
        ["Bachelor's degree in Computer Science", "MATCHED"],
    ]);
    assert.equal(profile.metrics.employerCompatibilityScore, profile.metrics.compatibilityScore);
    assert.equal(profile.metrics.estimatedRoleCompatibilityScore, null);
    assert.deepEqual(profile.metrics.missingKeywords, ["Tableau"]);
    assert.equal(profile.metrics.jobRequirements[0].matchStatus, profile.metrics.skillComparisons[0].matchStatus);
});

test("role-only analysis uses inferred competencies and a separate estimated score", () => {
    const roleCompetencyProfile = {
        roleTitle: "Data Analyst Intern",
        normalizedRole: "data analyst intern",
        experienceLevel: "Beginner",
        expectedExperienceLevel: "Entry-level experience.",
        technicalSkills: ["SQL", "Tableau"],
        coreCompetencies: ["Data interpretation"],
        toolsAndFrameworks: ["Tableau"],
        educationalExpectations: ["Statistics or a related field"],
        typicalResponsibilities: ["Prepare reports"],
        competencies: [
            { skillName: "SQL", skillId: "sql", category: "technical skill", importance: "Critical", description: "Query structured data.", relevanceReason: "Common for data analysis.", expectation: "essential" },
            { skillName: "Tableau", skillId: "tableau", category: "tool/framework", importance: "High", description: "Visualize data.", relevanceReason: "Common in reporting.", expectation: "preferred" },
            { skillName: "Data interpretation", skillId: "data-interpretation", category: "core competency", importance: "Medium", description: "Summarize data patterns.", relevanceReason: "Supports useful reporting.", expectation: "essential" },
        ],
    };
    const profile = mergeResumeAnalysis(parsedResume(), geminiProfile(), {
        mode: RESUME_ANALYSIS_MODES.ROLE_ONLY,
        roleCompetencyProfile,
    });

    assert.equal(profile.metrics.analysisMode, RESUME_ANALYSIS_MODES.ROLE_ONLY);
    assert.equal(profile.metrics.employerCompatibilityScore, null);
    assert.equal(profile.metrics.estimatedRoleCompatibilityScore, profile.metrics.compatibilityScore);
    assert.equal(profile.metrics.roleCompetencyProfile.roleTitle, "Data Analyst Intern");
    assert.equal(profile.metrics.jobRequirements.find((item) => item.skillName === "SQL").matchStatus, "MATCHED");
    assert.equal(profile.metrics.jobRequirements.find((item) => item.skillName === "Tableau").matchStatus, "MISSING");
    assert.ok(profile.metrics.compatibilityScore > 0);
});

test("resume-only mode preserves resume scores and never emits a job compatibility score", () => {
    const parsed = parsedResume();
    const profile = mergeResumeAnalysis(parsed, geminiProfile(), {
        mode: RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT,
    });

    assert.equal(profile.metrics.analysisMode, RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT);
    assert.equal(profile.metrics.atsScore, 100);
    assert.equal(profile.metrics.profileCompletion, 100);
    assert.equal(profile.metrics.employerCompatibilityScore, null);
    assert.equal(profile.metrics.estimatedRoleCompatibilityScore, null);
    assert.equal(profile.metrics.compatibilityScore, null);
    assert.deepEqual(profile.metrics.jobRequirements, []);
    assert.deepEqual(profile.metrics.missingKeywords, []);
    assert.ok(profile.metrics.generalImprovementSuggestions.length > 0);
    assert.deepEqual(profile.metrics.missingSkills, ["Excel", "Tableau"]);
    assert.equal(profile.metrics.improvementRecommendations.skills.some((item) => /learn sql/i.test(item)), false);
    assert.equal(profile.metrics.improvementRecommendations.skills.includes("Build advanced SQL performance skills"), true);
});

test("canonical skill matching normalizes aliases and treats education-only skill mentions as unverifiable", () => {
    assert.equal(normalizeSkillId("React.js"), "react");
    assert.equal(normalizeSkillId("NodeJS"), "node-js");
    const parsed = parsedResume({
        skills: ["React.js"],
        projects: [{ name: "Web app", description: "Built the interface with React.", technologies: ["React.js"], outcomes: [] }],
        education: [{ degree: "Course: Statistics", school: "State University", year: "2025" }],
    });
    const profile = mergeResumeAnalysis(parsed, geminiProfile({
        jobRequirements: [
            { skillName: "React", importance: "High", requirementType: "skill" },
            { skillName: "Statistics", importance: "Medium", requirementType: "skill" },
        ],
    }), { mode: RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION });

    assert.deepEqual(profile.metrics.jobRequirements.map((item) => item.matchStatus), ["MATCHED", "UNVERIFIABLE"]);
});

test("uses Gemini-extracted project evidence in the canonical resume skill match", () => {
    const parsed = parsedResume({
        experience: [],
        projects: [],
        skills: [],
    });
    const profile = mergeResumeAnalysis(parsed, geminiProfile({
        skills: { technical: ["Python"], tools: [], soft: [] },
        projectSummaries: [{
            name: "Image classifier",
            summary: "Trained and evaluated an image classifier.",
            technologies: ["Python"],
            outcomes: [],
        }],
        improvementRecommendations: {
            formatting: [],
            atsOptimization: [],
            experience: [],
            projects: [],
            skills: ["Learn Python", "Learn advanced Python", "Build advanced Python performance skills"],
        },
        jobRequirements: [{ skillName: "Python", importance: "Critical", requirementType: "skill" }],
    }), { mode: RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION });

    assert.equal(profile.metrics.jobRequirements[0].matchStatus, "MATCHED");
    assert.ok(profile.metrics.normalizedResumeSkills.find((item) => item.skillId === "python").sections.includes("projects"));
    assert.deepEqual(profile.metrics.improvementRecommendations.skills, ["Build advanced Python performance skills"]);
});

test("calculates weighted compatibility for the canonical four matching states", () => {
    const score = calculateCompatibilityScore([
        { importance: "Critical", matchStatus: "MATCHED" },
        { importance: "High", matchStatus: "PARTIALLY_MATCHED" },
        { importance: "Medium", matchStatus: "MISSING" },
        { importance: "Low", matchStatus: "UNVERIFIABLE" },
    ]);
    assert.equal(score, 58);
    assert.equal(calculateCompatibilityScore([]), null);
});

test("calculates independent resume structure score from text-assessable criteria", () => {
    const assessment = {
        sectionOrganization: { score: 100 },
        atsReadability: { score: 100 },
        formattingConsistency: { score: 50 },
        contentClarity: { score: 100 },
        experienceProjectPresentation: { score: 100 },
        contactEssentialSections: { score: 100 },
        grammarLanguage: { score: 100 },
        visualFormattingUnverified: true,
    };
    assert.equal(calculateStructureScore(assessment), 93);
});
