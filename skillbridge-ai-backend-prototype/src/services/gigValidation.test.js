import test from "node:test";
import assert from "node:assert/strict";
import { validateGigPayload } from "./gigValidation.js";

const futureDeadline = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const onlineGig = () => ({
    title: "Build a booking page",
    description: "Create a responsive booking page with form validation.",
    requiredSkills: ["React", " TypeScript "],
    budget: 12000,
    deadline: futureDeadline(),
    workMode: "online",
});

test("validates and normalizes online gig details", () => {
    const result = validateGigPayload(onlineGig());
    assert.equal(result.error, undefined);
    assert.deepEqual(result.value.requiredSkills, ["React", "TypeScript"]);
    assert.equal(result.value.budget, 12000);
    assert.equal(result.value.locationAddress, null);
});

test("requires valid address and coordinates for on-site gigs", () => {
    const missingLocation = validateGigPayload({ ...onlineGig(), workMode: "on_site" });
    assert.match(missingLocation.error, /address and valid latitude\/longitude/);

    const withLocation = validateGigPayload({
        ...onlineGig(),
        workMode: "on_site",
        locationAddress: "Mumbai office",
        geo: { lat: 19.076, lng: 72.8777 },
    });
    assert.equal(withLocation.error, undefined);
    assert.deepEqual(withLocation.value.locationLat, 19.076);
    assert.equal(withLocation.value.locationAddress, "Mumbai office");
});

test("rejects incomplete, past-deadline, and invalid-budget gig payloads", () => {
    assert.ok(validateGigPayload({ ...onlineGig(), requiredSkills: [] }).error);
    assert.ok(validateGigPayload({ ...onlineGig(), deadline: "2020-01-01" }).error);
    assert.ok(validateGigPayload({ ...onlineGig(), deadline: "2026-02-31" }).error);
    assert.ok(validateGigPayload({ ...onlineGig(), budget: 0 }).error);
});
