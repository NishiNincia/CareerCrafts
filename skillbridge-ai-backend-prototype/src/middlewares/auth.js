import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerMatch = typeof authHeader === "string"
        ? authHeader.match(/^Bearer\s+(\S+)$/i)
        : null;

    if (!bearerMatch) {
        return res.status(401).json({
            success: false,
            message: "Sign in to continue.",
            code: "AUTH_REQUIRED",
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("Authentication is unavailable because JWT_SECRET is not configured.");
        return res.status(500).json({
            success: false,
            message: "Authentication is not configured on the backend.",
            code: "AUTH_CONFIGURATION_ERROR",
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(bearerMatch[1], process.env.JWT_SECRET);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Your session has expired. Sign in again to continue.",
                code: "SESSION_EXPIRED",
            });
        }
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.NotBeforeError) {
            return res.status(401).json({
                success: false,
                message: "Your session is invalid. Sign in again to continue.",
                code: "INVALID_TOKEN",
            });
        }

        console.error("Unexpected authentication token verification failure:", error);
        return res.status(500).json({
            success: false,
            message: "Could not verify the current session.",
            code: "AUTH_VERIFICATION_ERROR",
        });
    }

    try {
        const result = await pool.query(
            "SELECT id,name,email,role FROM users WHERE id=$1",
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "The account for this session no longer exists. Sign in again.",
                code: "SESSION_USER_NOT_FOUND",
            });
        }

        req.user = result.rows[0];
        return next();
    } catch (error) {
        console.error("Could not load the authenticated user:", error);
        return res.status(500).json({
            success: false,
            message: "Could not verify the account for this session.",
            code: "AUTH_USER_LOOKUP_ERROR",
        });
    }
};

export const requireWorker = (req, res, next) => {
    if (req.user.role !== "worker") {
        return res.status(403).json({
            success: false,
            message: "Only worker accounts can use resume analysis.",
        });
    }

    next();
};