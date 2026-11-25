import assert from "node:assert/strict";
import test from "node:test";
import { validateGigNotificationPreferences } from "./notificationCenter.js";

test("notification preferences accept the default radius with or without a location", () => {
    assert.deepEqual(validateGigNotificationPreferences({ gigRadiusKm: 10 }), {
        value: { gigRadiusKm: 10, latitude: null, longitude: null },
    });
    assert.deepEqual(validateGigNotificationPreferences({
        gigRadiusKm: "25",
        latitude: "37.5",
        longitude: "-122.4",
    }), {
        value: { gigRadiusKm: 25, latitude: 37.5, longitude: -122.4 },
    });
});

test("notification preferences reject out-of-range radius and incomplete coordinates", () => {
    assert.equal(validateGigNotificationPreferences({ gigRadiusKm: 0 }).error !== undefined, true);
    assert.equal(validateGigNotificationPreferences({ gigRadiusKm: 101 }).error !== undefined, true);
    assert.equal(validateGigNotificationPreferences({ gigRadiusKm: 10, latitude: 40 }).error !== undefined, true);
    assert.equal(validateGigNotificationPreferences({
        gigRadiusKm: 10,
        latitude: 91,
        longitude: 0,
    }).error !== undefined, true);
});
