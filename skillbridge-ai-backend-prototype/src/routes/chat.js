import express from "express";
import {
    getChatContacts,
    getConversationMessages,
    getConversations,
    markConversationRead,
    sendChatMessage,
} from "../controller/chat.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);
router.get("/contacts", getChatContacts);
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.patch("/conversations/:conversationId/read", markConversationRead);
router.post("/messages", sendChatMessage);

export default router;
