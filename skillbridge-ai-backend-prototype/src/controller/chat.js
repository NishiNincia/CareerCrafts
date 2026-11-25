import pool from "../config/db.js";

const MAX_MESSAGE_LENGTH = 4_000;

function mapConversation(row) {
    return {
        id: row.id,
        participantId: row.other_user_id,
        name: row.other_user_name,
        role: row.other_user_role,
        preview: row.last_message || "",
        time: row.last_message_at || row.created_at,
        unread: Number(row.unread_count),
        contextId: row.context_id,
        contextType: row.context_type,
    };
}

export async function getChatContacts(req, res) {
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const oppositeRole = String(req.user.role).toLowerCase() === "worker" ? "employer" : "worker";
    try {
        const result = await pool.query(
            `SELECT id, name, role
             FROM users
             WHERE id <> $1 AND lower(role) = $2
               AND ($3 = '' OR name ILIKE '%' || $3 || '%' OR email ILIKE '%' || $3 || '%')
             ORDER BY name
             LIMIT 100`,
            [req.user.id, oppositeRole, search]
        );
        return res.json({
            success: true,
            data: result.rows.map((row) => ({ id: row.id, name: row.name, role: row.role })),
        });
    } catch (error) {
        console.error("Loading chat contacts failed:", error);
        return res.status(500).json({ success: false, message: "Could not load contacts." });
    }
}

export async function getConversations(req, res) {
    try {
        const result = await pool.query(
            `SELECT c.id, c.context_id, c.context_type, c.created_at, c.last_message_at,
                    other.id AS other_user_id, other.name AS other_user_name, other.role AS other_user_role,
                    (SELECT m.content FROM app_messages m
                     WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                    (SELECT COUNT(*)::int FROM app_messages m
                     WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.is_read = FALSE) AS unread_count
             FROM app_conversations c
             JOIN users other ON other.id = CASE
                 WHEN c.participant_a_id = $1 THEN c.participant_b_id
                 ELSE c.participant_a_id
             END
             WHERE c.participant_a_id = $1 OR c.participant_b_id = $1
             ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
            [req.user.id]
        );
        return res.json({ success: true, data: result.rows.map(mapConversation) });
    } catch (error) {
        console.error("Loading conversations failed:", error);
        return res.status(500).json({ success: false, message: "Could not load conversations." });
    }
}

export async function getConversationMessages(req, res) {
    const page = Number.parseInt(req.query.page, 10) || 0;
    const size = Number.parseInt(req.query.size, 10) || 50;
    if (page < 0 || size < 1 || size > 100) {
        return res.status(400).json({ success: false, message: "Page must be non-negative and size must be from 1 to 100." });
    }
    try {
        const conversation = await pool.query(
            `SELECT id FROM app_conversations
             WHERE id = $1 AND (participant_a_id = $2 OR participant_b_id = $2)`,
            [req.params.conversationId, req.user.id]
        );
        if (!conversation.rows.length) return res.status(404).json({ success: false, message: "Conversation not found." });

        const result = await pool.query(
            `SELECT m.id, m.sender_id, sender.name AS sender_name, m.content,
                    m.attachment_url, m.is_read, m.created_at
             FROM app_messages m
             JOIN users sender ON sender.id = m.sender_id
             WHERE m.conversation_id = $1
             ORDER BY m.created_at DESC, m.id DESC
             LIMIT $2 OFFSET $3`,
            [conversation.rows[0].id, size, page * size]
        );
        return res.json({
            success: true,
            data: result.rows.reverse().map((row) => ({
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_name,
                senderIsCurrentUser: row.sender_id === req.user.id,
                text: row.content,
                attachmentUrl: row.attachment_url,
                read: row.is_read,
                createdAt: row.created_at,
            })),
        });
    } catch (error) {
        console.error("Loading conversation messages failed:", error);
        return res.status(500).json({ success: false, message: "Could not load messages." });
    }
}

export async function sendChatMessage(req, res) {
    const recipientId = typeof req.body?.recipientId === "string" ? req.body.recipientId : "";
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    const contextType = ["general", "job", "gig"].includes(req.body?.contextType) ? req.body.contextType : "general";
    const contextId = typeof req.body?.contextId === "string" ? req.body.contextId : null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipientId)
        || recipientId === req.user.id
        || !content
        || content.length > MAX_MESSAGE_LENGTH
        || (contextId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId))) {
        return res.status(400).json({
            success: false,
            message: `Choose a valid recipient and enter a message of 1-${MAX_MESSAGE_LENGTH} characters.`,
        });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const recipient = await client.query("SELECT id, role FROM users WHERE id = $1", [recipientId]);
        if (!recipient.rows.length) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Recipient not found." });
        }

        const conversation = await client.query(
            `INSERT INTO app_conversations (
                participant_a_id, participant_b_id, context_id, context_type
             ) VALUES ($1, $2, $3, $4)
             ON CONFLICT (participant_low, participant_high)
             DO UPDATE SET context_id = COALESCE(app_conversations.context_id, EXCLUDED.context_id)
             RETURNING id`,
            [req.user.id, recipientId, contextId, contextType]
        );
        const conversationId = conversation.rows[0].id;
        const message = await client.query(
            `INSERT INTO app_messages (conversation_id, sender_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, sender_id, content, is_read, created_at`,
            [conversationId, req.user.id, content]
        );
        await client.query(
            "UPDATE app_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1",
            [conversationId]
        );
        await client.query(
            `INSERT INTO app_notifications (user_id, type, title, body, reference_id, route)
             VALUES ($1, 'chat_message', 'New message', $2, $3, $4)`,
            [
                recipientId,
                `${req.user.name}: ${content.slice(0, 180)}`,
                conversationId,
                `/${String(recipient.rows[0].role).toLowerCase()}/messages?conversationId=${encodeURIComponent(conversationId)}`,
            ]
        );
        await client.query("COMMIT");
        return res.status(201).json({
            success: true,
            data: {
                id: message.rows[0].id,
                conversationId,
                senderId: message.rows[0].sender_id,
                senderName: req.user.name,
                senderIsCurrentUser: true,
                text: message.rows[0].content,
                attachmentUrl: null,
                read: message.rows[0].is_read,
                createdAt: message.rows[0].created_at,
            },
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rolling back message send failed:", rollbackError);
            }
        }
        console.error("Sending message failed:", error);
        return res.status(500).json({ success: false, message: "Could not send this message." });
    } finally {
        client?.release();
    }
}

export async function markConversationRead(req, res) {
    try {
        const result = await pool.query(
            `UPDATE app_messages m
             SET is_read = TRUE
             FROM app_conversations c
             WHERE m.conversation_id = c.id AND m.conversation_id = $1
               AND m.sender_id <> $2
               AND (c.participant_a_id = $2 OR c.participant_b_id = $2)`,
            [req.params.conversationId, req.user.id]
        );
        const owned = await pool.query(
            `SELECT 1 FROM app_conversations
             WHERE id = $1 AND (participant_a_id = $2 OR participant_b_id = $2)`,
            [req.params.conversationId, req.user.id]
        );
        if (!owned.rows.length) return res.status(404).json({ success: false, message: "Conversation not found." });
        return res.json({ success: true, updated: result.rowCount });
    } catch (error) {
        console.error("Marking conversation read failed:", error);
        return res.status(500).json({ success: false, message: "Could not mark conversation as read." });
    }
}
