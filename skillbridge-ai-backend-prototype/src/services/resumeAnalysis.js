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

export function mergeResumeAnalysis(parsed, geminiProfile, jobDescription) {
    const geminiSkills = [
        ...geminiProfile.skills.technical,
        ...geminiProfile.skills.tools,
        ...geminiProfile.skills.soft,
    ];
    const skills = unique(geminiSkills.length ? geminiSkills : parsed.skills);
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
            summary: item.summary || "",
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
    const jobKeywords = jobDescription ? geminiProfile.missingKeywords : [];
    profile.metrics = {
        ...scores,
        jobDescriptionProvided: Boolean(jobDescription),
        missingKeywords: jobDescription ? jobKeywords : parsed.metrics.missingKeywords,
        missingSkills: parsed.metrics.missingSkills,
    };
    return profile;
}
