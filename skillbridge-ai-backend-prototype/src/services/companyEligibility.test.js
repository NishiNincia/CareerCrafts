import test from "node:test";
import assert from "node:assert/strict";
import { getCompanyEligibility } from "./companyEligibility.js";

test("allows micro and small companies only within their declared turnover limits", () => {
    assert.deepEqual(getCompanyEligibility("micro", 10), { eligible: true, turnoverLimitCr: 10 });
    assert.deepEqual(getCompanyEligibility("small", 100), { eligible: true, turnoverLimitCr: 100 });
    assert.equal(getCompanyEligibility("micro", 10.01).eligible, false);
    assert.equal(getCompanyEligibility("small", 100.01).eligible, false);
});

test("does not allow medium, large, or invalid company turnover", () => {
    assert.equal(getCompanyEligibility("medium", 5).eligible, false);
    assert.equal(getCompanyEligibility("large", 5).eligible, false);
    assert.equal(getCompanyEligibility("small", -1).eligible, false);
    assert.equal(getCompanyEligibility("small", Number.NaN).eligible, false);
    assert.equal(getCompanyEligibility("micro", null).eligible, false);
    assert.equal(getCompanyEligibility("micro", undefined).eligible, false);
});
