import { RESUME_ANALYSIS_MODES } from "./resumeJobContext.js";

function unique(values) {
    const seen = new Set();
    return values.filter((value) => {
        if (!value) return false;
        const key = String(value).trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

const SKILL_ALIASES = new Map([
    ["c++", "c-plus-plus"],
    ["c#", "c-sharp"],
    ["f#", "f-sharp"],
    ["javascript", "javascript"],
    ["js", "javascript"],
    ["typescript", "typescript"],
    ["ts", "typescript"],
    ["node.js", "node-js"],
    ["nodejs", "node-js"],
    ["react.js", "react"],
    ["reactjs", "react"],
    ["postgres", "postgresql"],
    ["postgresql", "postgresql"],
    ["sklearn", "scikit-learn"],
    ["scikit learn", "scikit-learn"],
    ["powerbi", "power-bi"],
    ["power bi", "power-bi"],
]);

export function normalizeSkillId(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    return SKILL_ALIASES.get(normalized)
        || normalized.replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function skillVariants(skillName, skillId) {
    return unique([
        skillName,
        ...[...SKILL_ALIASES.entries()]
            .filter(([, aliasId]) => aliasId === skillId)
            .map(([alias]) => alias),
    ]).sort((left, right) => right.length - left.length);
}

function textMentionsSkill(text, skillName, skillId = normalizeSkillId(skillName)) {
    if (!text || !skillName) return false;
    return skillVariants(skillName, skillId).some((variant) => {
        const expression = new RegExp(`(^|[^a-z0-9])${escapeRegExp(variant)}(?=$|[^a-z0-9])`, "i");
        return expression.test(text);
    });
}

function educationRequirementMatch(text, requirement) {
    const requirementText = `${requirement.skillName || ""} ${requirement.description || ""}`.toLowerCase();
    const educationText = text.toLowerCase();
    if (textMentionsSkill(educationText, requirement.skillName, normalizeSkillId(requirement.skillName))) {
        return "MATCHED";
    }

    const degreePatterns = [
        [/\b(?:bachelor|b\.?s\.?|b\.?e\.?|b\.?tech|undergraduate)\b/i, /\b(?:bachelor|b\.?s\.?|b\.?e\.?|b\.?tech|undergraduate)\b/i],
        [/\b(?:master|m\.?s\.?|m\.?e\.?|m\.?tech|postgraduate)\b/i, /\b(?:master|m\.?s\.?|m\.?e\.?|m\.?tech|postgraduate)\b/i],
        [/\b(?:ph\.?d|doctorate)\b/i, /\b(?:ph\.?d|doctorate)\b/i],
    ];
    const degreePattern = degreePatterns.find(([pattern]) => pattern.test(requirementText));
    const degreeMatches = !degreePattern || degreePattern[1].test(educationText);
    const stopWords = new Set(["a", "an", "and", "degree", "in", "of", "or", "the", "with"]);
    const fieldTokens = requirementText
        .replace(/\b(?:bachelor['’]?s?|b\.?s\.?|b\.?e\.?|b\.?tech|undergraduate|master['’]?s?|m\.?s\.?|m\.?e\.?|m\.?tech|postgraduate|ph\.?d|doctorate)\b/gi, " ")
        .match(/[a-z0-9]+/g)
        ?.filter((token) => !stopWords.has(token)) || [];
    const fieldMatches = fieldTokens.filter((token) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}(?=$|[^a-z0-9])`, "i").test(educationText));
    if (degreeMatches && fieldTokens.length && fieldMatches.length === fieldTokens.length) return "MATCHED";
    if (fieldMatches.length) return "UNVERIFIABLE";
    return "MISSING";
}

function createEvidenceSources(profile) {
    const sources = [];
    for (const project of profile.projects || []) {
        const text = [project.name, project.description, ...(project.technologies || []), ...(project.outcomes || [])]
            .filter(Boolean)
            .join(" ");
        if (text) sources.push({ section: "project", text, label: project.name || "Resume project" });
    }
    for (const experience of profile.experience || []) {
        const text = [experience.role, experience.company, experience.period, ...(experience.bullets || [])]
            .filter(Boolean)
            .join(" ");
        if (text) sources.push({ section: "experience", text, label: experience.role || "Work experience" });
    }
    for (const certification of profile.certifications || []) {
        sources.push({ section: "certification", text: certification, label: certification });
    }
    for (const education of profile.education || []) {
        const text = [education.degree, education.school, education.year].filter(Boolean).join(" ");
        if (text) sources.push({ section: "education", text, label: text });
    }
    if (profile.summary) sources.push({ section: "summary", text: profile.summary, label: "Resume summary" });
    return sources;
}

function getRequirementStatus(requirement, profile, evidenceSources) {
    const skillName = String(requirement.skillName || "").trim();
    const skillId = normalizeSkillId(requirement.skillId || skillName);
    const educationRequirement = String(requirement.requirementType || "").toLowerCase() === "education";
    const experienceRequirement = String(requirement.requirementType || "").toLowerCase() === "experience";

    if (educationRequirement) {
        const educationSources = evidenceSources.filter((source) => source.section === "education");
        const matched = educationSources.find((source) => educationRequirementMatch(source.text, requirement) === "MATCHED");
        if (matched) {
            return { status: "MATCHED", evidence: `${matched.label} (education).`, explanation: "The resume includes a matching education entry.", sections: ["education"] };
        }
        const unverifiable = educationSources.find((source) => educationRequirementMatch(source.text, requirement) === "UNVERIFIABLE");
        if (unverifiable) {
            return { status: "UNVERIFIABLE", evidence: `${unverifiable.label} (education only).`, explanation: "Education partially overlaps this expectation, but does not verify the required qualification.", sections: ["education"] };
        }
        return { status: "MISSING", evidence: "", explanation: "No matching education entry was found.", sections: [] };
    }

    if (experienceRequirement) {
        const requirementText = `${skillName} ${requirement.description || ""}`;
        const yearsRequired = requirementText.match(/(?:at least|min(?:imum)?\s*)?(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i);
        if (yearsRequired) {
            const required = Number(yearsRequired[1]);
            if (profile.yearsExperience >= required) {
                return { status: "MATCHED", evidence: `${profile.yearsExperience} years of experience were identified from dated roles.`, explanation: "The documented experience meets the stated minimum.", sections: ["experience"] };
            }
            if (profile.yearsExperience > 0) {
                return { status: "PARTIALLY_MATCHED", evidence: `${profile.yearsExperience} years identified; ${required} requested.`, explanation: "Some relevant experience is documented, but it is below the stated minimum.", sections: ["experience"] };
            }
            return { status: "MISSING", evidence: "", explanation: "No dated work experience was found for this requirement.", sections: [] };
        }
    }

    const skillListed = (profile.skills || []).some((skill) => normalizeSkillId(skill) === skillId
        || textMentionsSkill(skill, skillName, skillId));
    const strongEvidence = evidenceSources.find((source) =>
        ["project", "experience", "certification"].includes(source.section)
        && textMentionsSkill(source.text, skillName, skillId)
    );
    if (strongEvidence) {
        return {
            status: "MATCHED",
            evidence: `${strongEvidence.label} (${strongEvidence.section}).`,
            explanation: `Explicit evidence was found in ${strongEvidence.section} content.`,
            sections: [strongEvidence.section],
        };
    }

    const educationEvidence = evidenceSources.find((source) => source.section === "education"
        && textMentionsSkill(source.text, skillName, skillId));
    if (educationEvidence) {
        return {
            status: "UNVERIFIABLE",
            evidence: `${educationEvidence.label} (education only).`,
            explanation: "Education mentions this area, but does not verify applied ability.",
            sections: ["education"],
        };
    }

    if (skillListed || evidenceSources.some((source) => source.section === "summary"
        && textMentionsSkill(source.text, skillName, skillId))) {
        return {
            status: "PARTIALLY_MATCHED",
            evidence: skillListed ? "Listed in the resume skills section." : "Mentioned in the resume summary.",
            explanation: "The resume mentions this skill but does not provide direct application evidence.",
            sections: skillListed ? ["skills"] : ["summary"],
        };
    }
    return {
        status: "MISSING",
        evidence: "",
        explanation: "No explicit resume evidence was found.",
        sections: [],
    };
}

function requirementImprovement(requirement, status) {
    if (status === "MATCHED") return "";
    if (status === "PARTIALLY_MATCHED") {
        return `Add a project, internship, or certification showing how you applied ${requirement.skillName}.`;
    }
    if (status === "UNVERIFIABLE") {
        return `Add verifiable applied evidence for ${requirement.skillName} beyond an education entry.`;
    }
    return `Build relevant evidence for ${requirement.skillName} through a project, internship, or certification.`;
}

function isValidAdvancedSkillGap(recommendation, skillName) {
    if (!/\b(?:advanced|deeper|speciali[sz]ed|expert|higher[- ]level)\b/i.test(recommendation)) return false;
    const variants = skillVariants(skillName, normalizeSkillId(skillName));
    const matchedVariant = variants.find((variant) => {
        const expression = new RegExp(`(^|[^a-z0-9])${escapeRegExp(variant)}(?=$|[^a-z0-9])`, "i");
        return expression.test(recommendation);
    });
    if (!matchedVariant) return false;
    const expression = new RegExp(`(^|[^a-z0-9])${escapeRegExp(matchedVariant)}(?=$|[^a-z0-9])`, "i");
    const match = expression.exec(recommendation);
    const remaining = recommendation.slice(match.index + match[0].length).toLowerCase().match(/[a-z0-9]+/g) || [];
    const genericWords = new Set([
        "a", "and", "ability", "competencies", "competency", "expertise", "for", "in",
        "knowledge", "of", "on", "proficiency", "skill", "skills", "technique", "techniques",
        "the", "with",
    ]);
    return remaining.some((word) => !genericWords.has(word));
}

function normalizeRequirements(requirements) {
    const importanceWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const bySkill = new Map();
    for (const item of Array.isArray(requirements) ? requirements : []) {
        const skillName = String(item?.skillName || "").trim();
        if (!skillName) continue;
        const skillId = normalizeSkillId(item.skillId || skillName);
        if (!skillId) continue;
        const normalized = {
            skillName,
            skillId,
            category: String(item.category || "Competency"),
            importance: importanceWeight[item.importance] ? item.importance : "Medium",
            requirementType: String(item.requirementType || "skill"),
            description: String(item.description || ""),
            relevanceReason: String(item.relevanceReason || ""),
            expectation: item.expectation === "preferred" ? "preferred" : "essential",
            sourceEvidence: String(item.sourceEvidence || ""),
        };
        const existing = bySkill.get(skillId);
        if (!existing || importanceWeight[normalized.importance] > importanceWeight[existing.importance]) {
            bySkill.set(skillId, normalized);
        } else if (normalized.description && !existing.description.includes(normalized.description)) {
            existing.description = [existing.description, normalized.description].filter(Boolean).join("; ");
        }
    }
    return [...bySkill.values()];
}

function compareRequirements(requirements, profile) {
    const evidenceSources = createEvidenceSources(profile);
    return normalizeRequirements(requirements).map((requirement) => {
        const match = getRequirementStatus(requirement, profile, evidenceSources);
        return {
            ...requirement,
            matchStatus: match.status,
            supportingEvidence: match.evidence,
            explanation: match.explanation,
            skillSections: match.sections,
            identifiedGap: match.status === "MATCHED" ? "" : requirement.skillName,
            suggestedImprovement: requirementImprovement(requirement, match.status),
        };
    });
}

function buildNormalizedResumeSkills(profile) {
    const inventory = new Map();
    const add = (skillName, section) => {
        if (typeof skillName !== "string" || !skillName.trim()) return;
        const normalized = skillName.trim();
        const skillId = normalizeSkillId(normalized);
        if (!skillId) return;
        const item = inventory.get(skillId) || { skillName: normalized, skillId, sections: [] };
        if (!item.sections.includes(section)) item.sections.push(section);
        inventory.set(skillId, item);
    };
    for (const skill of profile.skills || []) add(skill, "skills");
    for (const project of profile.projects || []) {
        for (const technology of project.technologies || []) add(technology, "projects");
    }
    for (const certification of profile.certifications || []) add(certification, "certifications");
    return [...inventory.values()];
}

function buildKeywordAnalysis(comparisons) {
    return {
        present: unique(comparisons.filter((item) => item.matchStatus === "MATCHED").map((item) => item.skillName)),
        missingImportant: unique(comparisons
            .filter((item) => ["MISSING", "UNVERIFIABLE"].includes(item.matchStatus) && ["Critical", "High"].includes(item.importance))
            .map((item) => item.skillName)),
        presentWithoutEvidence: unique(comparisons
            .filter((item) => item.matchStatus === "PARTIALLY_MATCHED")
            .map((item) => item.skillName)),
        shouldHighlight: unique(comparisons
            .filter((item) => item.matchStatus === "MATCHED" && !(item.skillSections || []).includes("skills"))
            .map((item) => item.skillName)),
        requireAcquisition: unique(comparisons
            .filter((item) => item.matchStatus === "MISSING")
            .map((item) => item.skillName)),
    };
}

function sanitizeRecommendations(recommendations, comparisons, profile) {
    const source = recommendations && typeof recommendations === "object" ? recommendations : {};
    const evidenceSources = createEvidenceSources(profile);
    const demonstrated = unique([
        ...comparisons
        .filter((item) => item.matchStatus === "MATCHED")
            .map((item) => item.skillName),
        ...(profile.skills || []).filter((skill) => evidenceSources.some((evidence) =>
            ["project", "experience", "certification"].includes(evidence.section)
            && textMentionsSkill(evidence.text, skill)
        )),
    ]);
    const result = {};
    for (const category of ["formatting", "atsOptimization", "experience", "projects", "skills"]) {
        const items = Array.isArray(source[category]) ? source[category] : [];
        result[category] = unique(items
            .filter((item) => typeof item === "string" && item.trim())
            .filter((item) => !demonstrated.some((skill) =>
                textMentionsSkill(item, skill) && !isValidAdvancedSkillGap(item, skill)
            )));
    }
    return result;
}

function buildRoleRequirements(roleProfile) {
    if (!roleProfile) return [];
    const competencies = (roleProfile.competencies || []).map((item) => ({
        ...item,
        requirementType: item.category?.toLowerCase() === "education" ? "education" : "skill",
    }));
    const education = (roleProfile.educationalExpectations || []).map((expectation) => ({
        skillName: expectation,
        category: "Education",
        importance: "Medium",
        requirementType: "education",
        description: expectation,
        relevanceReason: "Common education expectation for this role.",
        expectation: "preferred",
    }));
    return [...competencies, ...education];
}

function buildGeneralImprovementSuggestions(recommendations, missingSkills) {
    const suggestions = Object.values(recommendations).flat();
    for (const skill of missingSkills) {
        suggestions.push(`Consider adding genuine resume evidence for ${skill} through a relevant project or experience.`);
    }
    if (!suggestions.length) {
        suggestions.push("Add concise, measurable outcomes to relevant experience and project bullets.");
        suggestions.push("Use consistent section headings and clear dates to improve resume readability.");
    }
    return unique(suggestions);
}

export function scoreResumeProfile(profile) {
    const skills = unique(profile.skills || []);
    const atsSections = [
        Boolean(profile.name || profile.email || profile.phone),
        Boolean(profile.summary),
        profile.experience?.length > 0,
        profile.education?.length > 0,
        skills.length > 0,
    ];
    const profileSections = [
        Boolean(profile.name),
        Boolean(profile.summary),
        profile.experience?.length > 0,
        profile.education?.length > 0,
        skills.length > 0,
        profile.projects?.length > 0,
    ];
    const atsScore = Math.round(100 * atsSections.filter(Boolean).length / atsSections.length);
    const profileCompletion = Math.round(100 * profileSections.filter(Boolean).length / profileSections.length);
    const skillStrength = Math.min(skills.length * 10, 100);

    return {
        atsScore,
        profileCompletion,
        skillStrength,
        resumeScore: Math.round(atsScore * 0.5 + profileCompletion * 0.3 + skillStrength * 0.2),
    };
}

export function mergeResumeAnalysis(parsed, geminiProfile, context = {}) {
    const mode = context.mode || RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT;
    const roleCompetencyProfile = mode === RESUME_ANALYSIS_MODES.ROLE_ONLY
        ? context.roleCompetencyProfile || null
        : null;
    const geminiSkills = [
        ...geminiProfile.skills.technical,
        ...geminiProfile.skills.tools,
        ...geminiProfile.skills.soft,
    ];
    const skills = unique([...parsed.skills, ...geminiSkills]);
    const experience = geminiProfile.experienceSummaries.length
        ? geminiProfile.experienceSummaries.map((item) => ({
            role: item.role || "",
            company: item.company || "",
            period: item.period || "",
            bullets: item.bullets.length ? item.bullets : item.summary ? [item.summary] : [],
            summary: item.summary || "",
        }))
        : parsed.experience;
    const education = geminiProfile.education.length
        ? geminiProfile.education.map((item) => ({
            school: item.school || "",
            degree: item.degree || "",
            year: item.year || "",
        }))
        : parsed.education;
    const projects = geminiProfile.projectSummaries.length
        ? geminiProfile.projectSummaries.map((item) => ({
            name: item.name || "Project",
            description: item.summary || item.outcomes.join(" "),
            technologies: item.technologies,
            outcomes: item.outcomes,
        }))
        : parsed.projects;
    const profile = {
        ...parsed,
        analysisProvider: geminiProfile.analysisProvider,
        analysisModel: geminiProfile.analysisModel,
        summary: geminiProfile.professionalSummary || parsed.summary,
        education,
        experience,
        projects,
        skills,
        certifications: geminiProfile.certifications.length ? geminiProfile.certifications : parsed.certifications,
        achievements: geminiProfile.achievements.length ? geminiProfile.achievements : parsed.achievements,
        competitions: geminiProfile.competitions.length ? geminiProfile.competitions : parsed.competitions,
        languages: geminiProfile.languages.length ? geminiProfile.languages : parsed.languages,
        interests: geminiProfile.interests.length ? geminiProfile.interests : parsed.interests,
        careerFocus: geminiProfile.careerFocus,
    };
    const scores = scoreResumeProfile(profile);
    const requirements = mode === RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION
        ? geminiProfile.jobRequirements
        : mode === RESUME_ANALYSIS_MODES.ROLE_ONLY
            ? buildRoleRequirements(roleCompetencyProfile)
            : [];
    const comparisons = compareRequirements(requirements, profile);
    const normalizedResumeSkills = buildNormalizedResumeSkills(profile);
    const recommendations = sanitizeRecommendations(geminiProfile.improvementRecommendations, comparisons, profile);
    const missingSkills = mode === RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT
        ? unique((parsed.metrics.missingSkills || []).filter((skill) =>
            getRequirementStatus({ skillName: skill }, profile, createEvidenceSources(profile)).status === "MISSING"
        ))
        : unique(comparisons.filter((item) => item.matchStatus === "MISSING").map((item) => item.skillName));
    const compatibilityScore = mode === RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT
        ? null
        : calculateCompatibilityScore(comparisons);
    const jobKeywords = mode === RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT
        ? []
        : unique(comparisons
            .filter((item) => item.matchStatus !== "MATCHED")
            .map((item) => item.skillName));

    profile.metrics = {
        ...scores,
        analysisMode: mode,
        jobDescriptionProvided: mode === RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION,
        missingKeywords: jobKeywords,
        missingSkills,
        structureScore: calculateStructureScore(geminiProfile.resumeStructureAssessment),
        compatibilityScore,
        employerCompatibilityScore: mode === RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION ? compatibilityScore : null,
        estimatedRoleCompatibilityScore: mode === RESUME_ANALYSIS_MODES.ROLE_ONLY ? compatibilityScore : null,
        jobRequirements: comparisons,
        skillComparisons: comparisons,
        normalizedResumeSkills,
        keywordAnalysis: mode === RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT ? null : buildKeywordAnalysis(comparisons),
        roleCompetencyProfile,
        generalImprovementSuggestions: mode === RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT
            ? buildGeneralImprovementSuggestions(recommendations, missingSkills)
            : [],
        experienceRelevance: [],
        projectRelevance: [],
        improvementRecommendations: recommendations,
    };
    return profile;
}

const STRUCTURE_WEIGHTS = {
    sectionOrganization: 20,
    atsReadability: 20,
    formattingConsistency: 15,
    contentClarity: 15,
    experienceProjectPresentation: 15,
    contactEssentialSections: 10,
    grammarLanguage: 5,
};

const REQUIREMENT_WEIGHTS = {
    Critical: 5,
    High: 4,
    Medium: 2,
    Low: 1,
};

const MATCH_FACTORS = {
    MATCHED: 1,
    PARTIALLY_MATCHED: 0.5,
    PARTIAL: 0.5,
    MISSING: 0,
    UNVERIFIABLE: 0,
    matched: 1,
    partial: 0.5,
    partially_matched: 0.5,
    missing: 0,
    unverifiable: 0,
};

export function calculateCompatibilityScore(requirements) {
    if (!Array.isArray(requirements) || !requirements.length) return null;
    let earned = 0;
    let total = 0;
    for (const requirement of requirements) {
        const weight = REQUIREMENT_WEIGHTS[requirement.importance] || 1;
        const factor = MATCH_FACTORS[String(requirement.matchStatus || "").toUpperCase()] ?? 0;
        earned += weight * factor;
        total += weight;
    }
    return total ? Math.round(earned / total * 100) : null;
}

export function calculateStructureScore(assessment) {
    if (!assessment || typeof assessment !== "object") return null;
    let score = 0;
    for (const [criterion, weight] of Object.entries(STRUCTURE_WEIGHTS)) {
        const value = Number(assessment[criterion]?.score);
        if (Number.isFinite(value)) score += Math.max(0, Math.min(weight, value / 100 * weight));
    }
    return Math.round(score);
}
