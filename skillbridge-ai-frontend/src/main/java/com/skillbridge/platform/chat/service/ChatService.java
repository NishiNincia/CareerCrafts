package com.skillbridge.platform.chat.service;

import com.skillbridge.platform.chat.dto.request.SendMessageRequest;
import com.skillbridge.platform.chat.entity.Conversation;
import com.skillbridge.platform.chat.entity.Message;

import java.util.List;
import java.util.UUID;

public interface ChatService {
    List<Conversation> getMyConversations(UUID userId);
    List<Message> getMessages(UUID userId, UUID conversationId, int page, int size);
    Message sendMessage(UUID senderId, SendMessageRequest request);
    void markConversationRead(UUID userId, UUID conversationId);
    void sendTypingStatus(UUID conversationId, UUID userId, boolean typing);
}
