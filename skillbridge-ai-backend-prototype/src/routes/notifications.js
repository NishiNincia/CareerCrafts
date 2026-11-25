import express from "express";
import {
    getNotificationPreferences,
    getNotifications,
    getUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    updateNotificationPreferences,
} from "../controller/notifications.js";
import { protect, requireWorker } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.get("/preferences", requireWorker, getNotificationPreferences);
router.put("/preferences", requireWorker, updateNotificationPreferences);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:notificationId/read", markNotificationRead);

export default router;
