import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            "SELECT id,name,email,role FROM users WHERE id=$1",
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = result.rows[0];

        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: "Invalid Token",
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