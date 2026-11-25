import pool from "../config/db.js";
import { validateGigNotificationPreferences } from "../services/notificationCenter.js";

const CATEGORY_BY_TYPE = {
    gig: "gig",
    job: "job",
    interview: "interview",
    payment: "payment",
    scheme: "scheme",
    chat_message: "message",
    system: "system",
};

function mapNotification(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.body,
        time: row.created_at,
        unread: !row.is_read,
        category: CATEGORY_BY_TYPE[row.type] || "system",
        route: row.route,
    };
}

export async function getNotifications(req, res) {
    const page = Number.parseInt(req.query.page, 10) || 0;
    const size = Number.parseInt(req.query.size, 10) || 50;
    if (page < 0 || size < 1 || size > 100) {
        return res.status(400).json({ success: false, message: "Page must be non-negative and size must be from 1 to 100." });
    }
    try {
        const result = await pool.query(
            `SELECT id, type, title, body, route, is_read, created_at
             FROM app_notifications
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, size, page * size]
        );
        return res.json({ success: true, data: result.rows.map(mapNotification) });
    } catch (error) {
        console.error("Loading notifications failed:", error);
        return res.status(500).json({ success: false, message: "Could not load notifications." });
    }
}

export async function getUnreadCount(req, res) {
    try {
        const result = await pool.query(
            "SELECT COUNT(*)::int AS count FROM app_notifications WHERE user_id = $1 AND is_read = FALSE",
            [req.user.id]
        );
        return res.json({ success: true, unreadCount: result.rows[0].count });
    } catch (error) {
        console.error("Loading unread notification count failed:", error);
        return res.status(500).json({ success: false, message: "Could not load unread notification count." });
    }
}

export async function markNotificationRead(req, res) {
    try {
        const result = await pool.query(
            `UPDATE app_notifications SET is_read = TRUE
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [req.params.notificationId, req.user.id]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: "Notification not found." });
        return res.json({ success: true });
    } catch (error) {
        console.error("Marking notification as read failed:", error);
        return res.status(500).json({ success: false, message: "Could not mark notification as read." });
    }
}

export async function markAllNotificationsRead(req, res) {
    try {
        await pool.query(
            "UPDATE app_notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
            [req.user.id]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error("Marking all notifications as read failed:", error);
        return res.status(500).json({ success: false, message: "Could not mark notifications as read." });
    }
}

export async function getNotificationPreferences(req, res) {
    try {
        const result = await pool.query(
            `SELECT gig_radius_km, latitude, longitude
             FROM worker_notification_preferences WHERE user_id = $1`,
            [req.user.id]
        );
        const preferences = result.rows[0];
        return res.json({
            success: true,
            preferences: {
                gigRadiusKm: preferences ? Number(preferences.gig_radius_km) : 10,
                latitude: preferences?.latitude === null || preferences?.latitude === undefined ? null : Number(preferences.latitude),
                longitude: preferences?.longitude === null || preferences?.longitude === undefined ? null : Number(preferences.longitude),
            },
        });
    } catch (error) {
        console.error("Loading notification preferences failed:", error);
        return res.status(500).json({ success: false, message: "Could not load notification preferences." });
    }
}

export async function updateNotificationPreferences(req, res) {
    const validation = validateGigNotificationPreferences(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    const { gigRadiusKm, latitude, longitude } = validation.value;
    try {
        const result = await pool.query(
            `INSERT INTO worker_notification_preferences (user_id, gig_radius_km, latitude, longitude)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET
                 gig_radius_km = EXCLUDED.gig_radius_km,
                 latitude = EXCLUDED.latitude,
                 longitude = EXCLUDED.longitude,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING gig_radius_km, latitude, longitude`,
            [req.user.id, gigRadiusKm, latitude, longitude]
        );
        const preferences = result.rows[0];
        return res.json({
            success: true,
            preferences: {
                gigRadiusKm: Number(preferences.gig_radius_km),
                latitude: preferences.latitude === null ? null : Number(preferences.latitude),
                longitude: preferences.longitude === null ? null : Number(preferences.longitude),
            },
        });
    } catch (error) {
        console.error("Saving notification preferences failed:", error);
        return res.status(500).json({ success: false, message: "Could not save notification preferences." });
    }
}
