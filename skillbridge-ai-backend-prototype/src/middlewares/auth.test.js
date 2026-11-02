import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "./auth.js";

function responseRecorder() {
    return {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        },
    };
}

test("protect rejects a missing bearer token with an actionable response", async () => {
    const res = responseRecorder();
    await protect({ headers: {} }, res, () => assert.fail("next should not be called"));

    assert.equal(res.statusCode, 401);
    assert.equal(res.payload.code, "AUTH_REQUIRED");
});

test("protect distinguishes expired sessions from malformed tokens", async () => {
    const priorSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "auth-middleware-test-secret";
    try {
        const expiredToken = jwt.sign({ id: "user-1" }, process.env.JWT_SECRET, { expiresIn: -1 });
        const expiredRes = responseRecorder();
        await protect({ headers: { authorization: `Bearer ${expiredToken}` } }, expiredRes, () => {});

        const invalidRes = responseRecorder();
        await protect({ headers: { authorization: "Bearer not-a-jwt" } }, invalidRes, () => {});

        assert.equal(expiredRes.statusCode, 401);
        assert.equal(expiredRes.payload.code, "SESSION_EXPIRED");
        assert.equal(invalidRes.statusCode, 401);
        assert.equal(invalidRes.payload.code, "INVALID_TOKEN");
    } finally {
        if (priorSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = priorSecret;
    }
});

test("protect reports user lookup failures as server errors, not invalid tokens", async () => {
    const priorSecret = process.env.JWT_SECRET;
    const priorQuery = pool.query;
    process.env.JWT_SECRET = "auth-middleware-test-secret";
    pool.query = async () => {
        throw new Error("database unavailable");
    };

    try {
        const token = jwt.sign({ id: "user-1" }, process.env.JWT_SECRET);
        const res = responseRecorder();
        await protect({ headers: { authorization: `Bearer ${token}` } }, res, () => {});

        assert.equal(res.statusCode, 500);
        assert.equal(res.payload.code, "AUTH_USER_LOOKUP_ERROR");
    } finally {
        pool.query = priorQuery;
        if (priorSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = priorSecret;
    }
});
