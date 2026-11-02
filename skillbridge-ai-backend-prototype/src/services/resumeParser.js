const SECTION_PATTERNS = [
    ["experience", /^(?:professional\s+)?(?:work\s+)?experience|^employment(?:\s+history)?$|^work\s+history$/i],
    ["education", /^education(?:al\s+background)?$/i],
    ["skills", /^(?:technical\s+)?skills$|^technologies$/i],
    ["programmingLanguages", /^(?:programming\s+)?languages$/i],
    ["projects", /^(?:(?:research|selected|personal)\s*(?:(?:&|and)\s*ai\s*\/\s*ml\s*)?)?(?:ai\s*\/\s*ml\s*)?(?:selected\s+)?projects$|^rojects$/i],
    ["certifications", /^(?:certifications?|licenses?)(?:\s*(?:&|and)\s*achievements?)?$|^achievements?\s*(?:&|and)\s*certifications?$/i],
    ["competitions", /^(?:hackathons?|competitions?|hackathons?\s*(?:&|and)\s*competitions?|competitions?\s*(?:&|and)\s*hackathons?)$/i],
    ["achievements", /^(?:achievements?|awards?)$/i],
    ["interests", /^(?:areas?\s+of\s+)?interests?$/i],
    ["summary", /^(?:professional\s+)?summary$|^profile$|^objective$/i],
];

const DATE_PERIOD = /((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:19|20)\d{2})\s*(?:-|–|—|to|through)\s*((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current|now))/i;
const MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const LEVEL_SKILLS = {
    Beginner: ["HTML", "CSS", "JavaScript", "Git"],
    Intermediate: ["TypeScript", "React", "SQL", "Automated testing"],
    Advanced: ["System design", "Cloud architecture", "CI/CD", "Security"],
};

function cleanLine(line) {
    return line.replace(/^[\s•●▪*-]+/, "").replace(/\s+/g, " ").trim();
}

function parseDate(value, isEnd = false) {
    const currentYear = new Date().getFullYear();
    if (/present|current|now/i.test(value)) {
        return currentYear * 12 + new Date().getMonth();
    }

    const year = Number(value.match(/(?:19|20)\d{2}/)?.[0]);
    if (!year) return null;

    const monthName = value.match(/[A-Za-z]{3,}/)?.[0]?.slice(0, 3).toLowerCase();
    const month = monthName ? MONTHS[monthName] : (isEnd ? 11 : 0);
    return year * 12 + (month ?? (isEnd ? 11 : 0));
}

function getExperienceMonths(periods) {
    const intervals = periods
        .map((period) => {
            const match = period.match(DATE_PERIOD);
            if (!match) return null;
            const start = parseDate(match[1]);
            const end = parseDate(match[2], true);
            return start === null || end === null || end < start ? null : [start, end];
        })
        .filter(Boolean)
        .sort((a, b) => a[0] - b[0]);

    let totalMonths = 0;
    let intervalStart = null;
    let intervalEnd = null;
    for (const [start, end] of intervals) {
        if (intervalEnd === null || start > intervalEnd + 1) {
            if (intervalStart !== null) totalMonths += intervalEnd - intervalStart + 1;
            intervalStart = start;
            intervalEnd = end;
        } else {
            intervalEnd = Math.max(intervalEnd, end);
        }
    }
    if (intervalStart !== null) totalMonths += intervalEnd - intervalStart + 1;
    return totalMonths;
}

function splitRoleAndCompany(value) {
    const parts = value.split(/\s+(?:at|@)\s+|\s*[|•–—]\s*/i).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) return { role: parts[0], company: parts.slice(1).join(" - ") };
    return { role: value.trim(), company: "" };
}

function parseExperience(lines) {
    const experiences = [];
    let current = null;

    const saveCurrent = () => {
        if (current && (current.role || current.company || current.bullets.length)) {
            experiences.push(current);
        }
        current = null;
    };

    for (const rawLine of lines) {
        const line = cleanLine(rawLine);
        if (!line) continue;

        const dateMatch = line.match(DATE_PERIOD);
        if (dateMatch) {
            const titleAndCompany = cleanLine(line.slice(0, dateMatch.index).replace(/[|–—-]+$/, ""));
            if (current && !current.period && (current.role || current.company)) {
                current.period = dateMatch[0];
                continue;
            }
            if (current && !current.role && !current.company && !current.period) {
                current.period = dateMatch[0];
                continue;
            }
            if (current && (current.role || current.company || current.period)) saveCurrent();
            const { role, company } = titleAndCompany
                ? splitRoleAndCompany(titleAndCompany)
                : { role: "", company: "" };
            current = {
                role,
                company,
                period: dateMatch[0],
                bullets: [],
            };
            continue;
        }

        if (/^[•●▪*-]/.test(rawLine.trim()) && current) {
            current.bullets.push(line);
        } else if (current && current.period && !current.role && !current.company) {
            const { role, company } = splitRoleAndCompany(line);
            current.role = role;
            current.company = company;
        } else if (current && !current.company) {
            current.company = line;
        } else {
            saveCurrent();
            const { role, company } = splitRoleAndCompany(line);
            current = { role, company, period: "", bullets: [] };
        }
    }

    saveCurrent();
    return experiences;
}

function parseEducation(lines) {
    return lines.map(cleanLine).filter(Boolean).map((line) => {
        const year = line.match(/\b(?:19|20)\d{2}(?:\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current))?\b/i)?.[0] ?? "";
        const parts = line.replace(year, "").split(/\s*[|,;]\s*/).filter(Boolean);
        return {
            degree: parts[0] ?? line,
            school: parts.slice(1).join(", ") || "",
            year,
        };
    });
}

function parseProjects(lines) {
    const projects = [];
    let current = null;
    const saveCurrent = () => {
        if (current) {
            current.description = current.description.join(" ").trim();
            projects.push(current);
        }
        current = null;
    };

    for (const rawLine of lines) {
        const line = cleanLine(rawLine);
        if (!line) continue;

        const isBullet = /^[•●▪*-]/.test(rawLine.trim());
        const stackMatch = line.match(/^(.+?)\s+—\s+(.+)$/);
        const namedProject = /^.{2,100}:\s+\S/.test(line);
        const looksLikeTitle = !isBullet && (stackMatch || namedProject);
        const technologyContinuation = /^\s*·\s*(.+)$/.exec(rawLine);
        if (current && technologyContinuation && !looksLikeTitle) {
            current.technologies = distinct([
                ...current.technologies,
                ...technologyContinuation[1].split(/[·,;|]/).map((technology) => technology.trim()),
            ]);
            continue;
        }
        if (looksLikeTitle || !current) {
            saveCurrent();
            const title = stackMatch?.[1] ?? line;
            const stack = stackMatch?.[2] ?? "";
            const [name, description = ""] = title.split(/\s*[|:]\s*/, 2);
            current = {
                name: name.trim(),
                description: description ? [description] : [],
                technologies: stack ? distinct(stack.split(/[·,;|]/).map((technology) => technology.trim())) : [],
            };
        } else {
            current.description.push(line);
        }
    }
    saveCurrent();
    return projects;
}

function distinct(values) {
    return [...new Map(values.filter(Boolean).map((value) => [value.toLowerCase(), value])).values()];
}

function splitListItems(lines) {
    return distinct(lines.flatMap((rawLine) => cleanLine(rawLine).split(/\s*[·•|]\s*/).map((item) => item.trim())));
}

function isAchievement(value) {
    return /\b(award(?:ed)?|achievement|winner|finalist|top\s+\d+%?|elite\s+(?:gold|silver|bronze)|selected\s+among|advanced\s+to|placed\s+\d+)\b/i.test(value);
}

function getAchievementDetails(value) {
    const details = value.match(/\(([^()]*)\)/)?.[1];
    return details && isAchievement(details) ? [details.trim()] : [];
}

function parseSections(text) {
    const sections = {
        header: [],
        experience: [],
        education: [],
        skills: [],
        programmingLanguages: [],
        projects: [],
        certifications: [],
        achievements: [],
        competitions: [],
        interests: [],
        summary: [],
    };
    let currentSection = "header";

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const markdownHeading = line.replace(/^#{1,6}\s*/, "");
        const inlineLanguageHeading = markdownHeading.match(/^languages?(?:\s*:\s*|\s+)(.+)$/i);
        if (inlineLanguageHeading) {
            currentSection = "programmingLanguages";
            const languageContent = inlineLanguageHeading[1];
            const inlineInterests = /(?:\s*\|\s*|\s+)interests?\s*:?\s*(.*)$/i.exec(languageContent);
            const languageText = (inlineInterests
                ? languageContent.slice(0, inlineInterests.index).replace(/\s*\|\s*$/, "")
                : languageContent).trim();
            if (languageText) sections.programmingLanguages.push(languageText);
            if (inlineInterests) {
                if (inlineInterests[1].trim()) sections.interests.push(inlineInterests[1].trim());
                currentSection = "interests";
            }
            continue;
        }

        const heading = cleanLine(markdownHeading).replace(/:$/, "");
        const section = SECTION_PATTERNS.find(([, pattern]) => pattern.test(heading));
        if (section) {
            currentSection = section[0];
            continue;
        }

        if (currentSection === "programmingLanguages") {
            const inlineInterests = rawLine.match(/\s+interests?\s*(.*)$/i);
            if (inlineInterests) {
                const languageText = rawLine.slice(0, inlineInterests.index).trim();
                if (languageText) sections.programmingLanguages.push(languageText);
                if (inlineInterests[1].trim()) sections.interests.push(inlineInterests[1].trim());
                currentSection = "interests";
                continue;
            }
        }
        sections[currentSection].push(rawLine);
    }
    return sections;
}

export function classifyCareerLevel({ yearsExperience, experiences, projects, resumeText, title = "" }) {
    const titleText = [title, ...experiences.map(({ role }) => role)].join(" ");
    const seniorTitle = /\b(senior|staff|principal|lead|director|head|chief|architect)\b/i.test(titleText);
    const mentorsOthers = /\b(mentor(?:ed|ing)?|coached|managed\s+(?:a\s+)?team|led\s+(?:a\s+)?team)\b/i.test(resumeText);
    const designsLargeSystems = /\b(design(?:ed|s)?|architect(?:ed|s)?|scale[ds]?)\b.{0,80}\b(large[- ]scale|distributed|enterprise|platform|system|architecture)\b/i.test(resumeText);
    const projectText = projects.map(({ name, description }) => `${name} ${description}`).join(" ");
    const complexIndependentProject =
        projects.length > 0 &&
        /\b(independently|production[- ]ready|scalable|deployed|end[- ]to[- ]end|microservices|multi[- ]tenant|real[- ]time|built.{0,50}(?:platform|application|system))\b/i.test(projectText);

    if (yearsExperience >= 5 || seniorTitle || mentorsOthers || designsLargeSystems) return "Advanced";
    if (yearsExperience > 2 || experiences.length > 0 || complexIndependentProject) return "Intermediate";
    return "Beginner";
}

export function analyzeResumeText(resumeText) {
    if (typeof resumeText !== "string" || !resumeText.trim()) {
        throw new TypeError("Resume text is required.");
    }

    const sections = parseSections(resumeText);
    const email = resumeText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? "";
    const phone = resumeText.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,6}\b/)?.[0] ?? "";
    const headerLines = sections.header.map(cleanLine);
    const name = headerLines.find((line) => !line.includes("@") && !/^\+?[\d\s().-]{8,}$/.test(line) && !/^(resume|curriculum vitae|cv)$/i.test(line)) ?? "";
    const title = headerLines.find((line) => line !== name && !line.includes("@") && !/^\+?[\d\s().-]{8,}$/.test(line)) ?? "";
    const summary = sections.summary.map(cleanLine).join(" ").trim();
    const experiences = parseExperience(sections.experience);
    const education = parseEducation(sections.education);
    const projects = parseProjects(sections.projects);
    const skills = distinct(sections.skills.flatMap((line) =>
        cleanLine(line)
            .replace(/^[^:]{1,60}:\s*/, "")
            .split(/[,;|•]/)
            .map((skill) => skill.trim())
    ));
    const certificationItems = splitListItems(sections.certifications);
    const certifications = certificationItems;
    const achievements = distinct([
        ...certificationItems.flatMap(getAchievementDetails),
        ...splitListItems(sections.achievements),
    ]);
    const competitions = splitListItems(sections.competitions);
    const languages = splitListItems(sections.programmingLanguages);
    const interests = splitListItems(sections.interests);

    const claimedYears = [...resumeText.matchAll(/\b(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?experience\b/gi)]
        .map((match) => Number(match[1]))
        .filter(Number.isFinite);
    const datedYears = getExperienceMonths(experiences.map(({ period }) => period)) / 12;
    const yearsExperience = Math.round(Math.max(datedYears, ...claimedYears, 0) * 10) / 10;
    const careerLevel = classifyCareerLevel({ yearsExperience, experiences, projects, resumeText, title });

    const profileFields = [name, summary, experiences.length, education.length, skills.length, projects.length];
    const profileCompletion = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);
    const skillStrength = Math.min(skills.length * 10, 100);
    const atsSections = [name || email || phone, summary, experiences.length, education.length, skills.length];
    const atsScore = Math.round(atsSections.filter(Boolean).length / atsSections.length * 100);
    const resumeScore = Math.round(atsScore * 0.5 + profileCompletion * 0.3 + skillStrength * 0.2);
    const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));
    const missingSkills = LEVEL_SKILLS[careerLevel].filter((skill) => !skillSet.has(skill.toLowerCase()));

    return {
        name,
        title,
        summary,
        email,
        phone,
        education,
        experience: experiences,
        skills,
        projects,
        certifications,
        achievements,
        competitions,
        languages,
        interests,
        yearsExperience,
        careerLevel,
        metrics: {
            atsScore,
            resumeScore,
            profileCompletion,
            skillStrength,
            missingKeywords: missingSkills,
            missingSkills,
        },
    };
}
