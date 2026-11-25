export const RESUME_ANALYSIS_MODES = Object.freeze({
    FULL_JOB_DESCRIPTION: "FULL_JOB_DESCRIPTION",
    ROLE_ONLY: "ROLE_ONLY",
    NO_JOB_CONTEXT: "NO_JOB_CONTEXT",
});

const ROLE_TITLE_ENDING = /\b(?:engineer|developer|analyst|scientist|designer|manager|administrator|architect|consultant|specialist|researcher|technician|coordinator|accountant|marketer|writer|product\s+owner|data\s+scientist)(?:\s+(?:intern|apprentice|trainee))?$/i;
const DETAIL_SIGNALS = /\b(?:responsibilities|qualifications|requirements|preferred|required|must[- ]have|nice[- ]to[- ]have|experience|education|degree|skills|proficiency|knowledge of|you will|you'll|responsible for|what you(?:'|’)ll do|we are looking for|build|develop|design|maintain|support|using|with)\b/i;
const BULLET_LINE = /^\s*(?:[-*•●▪]|\d+[.)])\s+/m;

export class InvalidJobContextError extends Error {
    constructor() {
        super("Enter a recognized job title or provide a detailed job description.");
        this.name = "InvalidJobContextError";
        this.status = 422;
        this.code = "INVALID_JOB_CONTEXT";
    }
}

export function normalizeRoleTitle(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function inferRoleExperienceLevel(roleTitle, candidateLevel = "Beginner") {
    if (/\b(?:intern|apprentice|trainee|junior|entry[- ]level|associate)\b/i.test(roleTitle)) return "Beginner";
    if (/\b(?:senior|staff|principal|lead|director|head|chief)\b/i.test(roleTitle)) return "Advanced";
    return ["Beginner", "Intermediate", "Advanced"].includes(candidateLevel) ? candidateLevel : "Beginner";
}

function isRoleTitle(value) {
    const words = value.match(/[a-z0-9+#./&-]+/gi) || [];
    return value.length <= 100
        && words.length >= 2
        && words.length <= 8
        && !/[.!?;:\n\r]/.test(value)
        && !DETAIL_SIGNALS.test(value)
        && ROLE_TITLE_ENDING.test(value);
}

function isDetailedDescription(value) {
    const wordCount = (value.match(/\b[\w+#.-]+\b/g) || []).length;
    const sentenceCount = (value.match(/[.!?](?:\s|$)/g) || []).length;
    return DETAIL_SIGNALS.test(value)
        || BULLET_LINE.test(value)
        || value.length >= 220
        || wordCount >= 30
        || sentenceCount >= 2
        || /\r?\n/.test(value);
}

export function classifyJobInput({ jobDescription = "", jobId = "", jobTitle = "" } = {}) {
    const description = typeof jobDescription === "string" ? jobDescription.trim() : "";
    const id = typeof jobId === "string" ? jobId.trim() : "";
    const suppliedTitle = typeof jobTitle === "string" ? jobTitle.trim().replace(/\s+/g, " ") : "";

    if (id) {
        return {
            mode: RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION,
            roleTitle: suppliedTitle,
            normalizedRole: "",
        };
    }
    if (!description && !suppliedTitle) {
        return {
            mode: RESUME_ANALYSIS_MODES.NO_JOB_CONTEXT,
            roleTitle: "",
            normalizedRole: "",
        };
    }

    const input = description || suppliedTitle;
    if (description && isDetailedDescription(description)) {
        return {
            mode: RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION,
            roleTitle: suppliedTitle,
            normalizedRole: "",
        };
    }
    if (!description && suppliedTitle && isRoleTitle(suppliedTitle)) {
        return {
            mode: RESUME_ANALYSIS_MODES.ROLE_ONLY,
            roleTitle: suppliedTitle,
            normalizedRole: normalizeRoleTitle(suppliedTitle),
        };
    }
    if (isRoleTitle(input)) {
        return {
            mode: RESUME_ANALYSIS_MODES.ROLE_ONLY,
            roleTitle: input,
            normalizedRole: normalizeRoleTitle(input),
        };
    }
    if (isDetailedDescription(input)) {
        return {
            mode: RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION,
            roleTitle: suppliedTitle,
            normalizedRole: "",
        };
    }

    throw new InvalidJobContextError();
}
