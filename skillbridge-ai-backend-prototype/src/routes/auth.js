import express from "express";

import {
    register,
    login,
    getMe,
} from "../controller/auth.js";

import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

export default router;