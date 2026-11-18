import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMPLOYMENT_TYPES = new Set(["full-time", "part-time", "contract"]);

export async function ensureJobListingsSchema(pool) {
    const migration = await readFile(
        path.resolve(__dirname, "..", "prisma", "job-listings.sql"),
        "utf8"
    );
    await pool.query(migration);
}

export function validateJobPayload(body) {
    const source = body && typeof body === "object" ? body : {};
    const title = typeof source.title === "string" ? source.title.trim() : "";
    const description = typeof source.description === "string" ? source.description.trim() : "";
    const address = typeof (source.address ?? source.location) === "string"
        ? (source.address ?? source.location).trim()
        : "";
    const employmentType = source.employmentType ?? source.type;
    const salaryMin = Number(source.minSalary ?? source.salaryMin);
    const salaryMax = Number(source.maxSalary ?? source.salaryMax);
    const latitude = Number(source.latitude ?? source.lat);
    const longitude = Number(source.longitude ?? source.lng);
    const skillsInput = source.requiredSkills ?? source.skills;
    const skills = Array.isArray(skillsInput)
        ? skillsInput.filter((skill) => typeof skill === "string").map((skill) => skill.trim()).filter(Boolean)
        : typeof skillsInput === "string"
            ? skillsInput.split(",").map((skill) => skill.trim()).filter(Boolean)
            : [];

    if (
        title.length < 3 || title.length > 180 ||
        description.length < 20 ||
        !address ||
        !EMPLOYMENT_TYPES.has(employmentType) ||
        !Number.isFinite(salaryMin) || salaryMin <= 0 ||
        !Number.isFinite(salaryMax) || salaryMax < salaryMin ||
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
        skills.length === 0
    ) {
        return {
            error: "Enter a job title, description, location, valid coordinates, employment type, salary range, and at least one required skill.",
        };
    }

    return {
        value: {
            title,
            description,
            address,
            employmentType,
            salaryMin,
            salaryMax,
            latitude,
            longitude,
            skills: [...new Map(skills.map((skill) => [skill.toLowerCase(), skill])).values()],
        },
    };
}

export function calculateDistanceKm(latitude, longitude, destinationLatitude, destinationLongitude) {
    const radians = (degrees) => degrees * Math.PI / 180;
    const latitudeDifference = radians(destinationLatitude - latitude);
    const longitudeDifference = radians(destinationLongitude - longitude);
    const haversine =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(radians(latitude)) * Math.cos(radians(destinationLatitude)) *
        Math.sin(longitudeDifference / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function normalizeSkill(skill) {
    return skill.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function calculateJobMatchScore(requiredSkills, resumeSkills) {
    if (!requiredSkills.length || !resumeSkills.length) return 0;
    const candidateSkills = new Set(resumeSkills.map(normalizeSkill));
    const matches = requiredSkills.filter((skill) => candidateSkills.has(normalizeSkill(skill)));
    return Math.round(matches.length / requiredSkills.length * 100);
}

export function mapJobListing(row, { distanceKm = null, resumeSkills = [] } = {}) {
    const skills = Array.isArray(row.skills) ? row.skills : [];
    return {
        id: row.id,
        title: row.title,
        company: row.company ?? "",
        location: row.address,
        geo: { lat: Number(row.latitude), lng: Number(row.longitude) },
        distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
        type: row.employment_type,
        status: row.status ?? "open",
        salaryMin: Number(row.salary_min),
        salaryMax: Number(row.salary_max),
        matchScore: resumeSkills === null ? null : calculateJobMatchScore(skills, resumeSkills),
        applicationStatus: row.application_status ?? null,
        skills,
        postedAt: row.created_at,
        description: row.description,
    };
}
