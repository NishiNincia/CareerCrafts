import test from "node:test";
import assert from "node:assert/strict";
import {
    calculateDistanceKm,
    calculateJobMatchScore,
    mapJobListing,
    validateJobPayload,
} from "./jobListings.js";

const validJob = {
    title: "Site Electrician",
    description: "Install and maintain electrical systems at residential job sites.",
    location: "Powai, Mumbai",
    latitude: 19.1176,
    longitude: 72.906,
    type: "full-time",
    salaryMin: 22000,
    salaryMax: 28000,
    skills: ["Electrical Wiring", "Panel Installation"],
};

test("validates and normalizes employer job details", () => {
    const result = validateJobPayload(validJob);

    assert.equal(result.error, undefined);
    assert.deepEqual(result.value.skills, validJob.skills);
    assert.equal(result.value.latitude, validJob.latitude);
});

test("rejects missing coordinates, invalid pay ranges, and unsupported job types", () => {
    assert.ok(validateJobPayload({ ...validJob, latitude: undefined }).error);
    assert.ok(validateJobPayload({ ...validJob, salaryMax: 100 }).error);
    assert.ok(validateJobPayload({ ...validJob, type: "temporary" }).error);
});

test("calculates distance for identical and nearby locations", () => {
    assert.equal(calculateDistanceKm(19.1, 72.9, 19.1, 72.9), 0);
    const distance = calculateDistanceKm(19.1176, 72.906, 19.0857, 72.9081);
    assert.ok(distance > 3 && distance < 4);
});

test("matches parsed resume skills without calling a generation model", () => {
    assert.equal(
        calculateJobMatchScore(["Electrical Wiring", "Panel Installation"], ["electrical wiring"]),
        50
    );
    assert.equal(calculateJobMatchScore(["Electrical Wiring"], []), 0);
});

test("maps persisted job data to the frontend job card shape", () => {
    const job = mapJobListing({
        id: "job-id",
        title: "Site Electrician",
        company: "UrbanBuild",
        address: "Powai, Mumbai",
        latitude: "19.1176",
        longitude: "72.906",
        employment_type: "full-time",
        salary_min: "22000.00",
        salary_max: "28000.00",
        skills: ["Electrical Wiring"],
        created_at: "2026-10-27T00:00:00.000Z",
        description: "Install electrical systems.",
    }, { distanceKm: 2.34, resumeSkills: ["Electrical Wiring"] });

    assert.deepEqual(job.geo, { lat: 19.1176, lng: 72.906 });
    assert.equal(job.distanceKm, 2.3);
    assert.equal(job.salaryMin, 22000);
    assert.equal(job.matchScore, 100);
    assert.equal(job.applicationStatus, null);
});

test("does not claim resume matching when a worker has not parsed a resume", () => {
    const job = mapJobListing({
        id: "job-id",
        title: "Site Electrician",
        company: "UrbanBuild",
        address: "Powai, Mumbai",
        latitude: 19.1176,
        longitude: 72.906,
        employment_type: "full-time",
        salary_min: 22000,
        salary_max: 28000,
        skills: ["Electrical Wiring"],
        created_at: "2026-10-27T00:00:00.000Z",
        description: "Install electrical systems.",
    }, { distanceKm: 2.34, resumeSkills: null });
    assert.equal(job.matchScore, null);
});

test("includes whether the worker has already applied", () => {
    const job = mapJobListing({
        id: "job-id",
        title: "Site Electrician",
        company: "UrbanBuild",
        address: "Powai, Mumbai",
        employment_type: "full-time",
        salary_min: 22000,
        salary_max: 28000,
        skills: [],
        created_at: "2026-10-27T00:00:00.000Z",
        description: "Install electrical systems.",
        application_status: "applied",
    });

    assert.equal(job.applicationStatus, "applied");
});
