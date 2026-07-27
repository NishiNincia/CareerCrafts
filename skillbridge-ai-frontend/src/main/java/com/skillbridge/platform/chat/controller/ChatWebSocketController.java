package com.skillbridge.platform.chat.controller;

import com.skillbridge.platform.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * STOMP message-mapped endpoints for realtime chat features that don't need
 * a persisted HTTP response (typing indicators). Clients send to
 * /app/chat/{conversationId}/typing; broadcasts land on /topic/chat/{conversationId}.
 */
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat/{conversationId}/typing")
    public void typing(@DestinationVariable UUID conversationId, SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        UUID userId = UUID.fromString(principal.getName());
        chatService.sendTypingStatus(conversationId, userId, true);
    }
}
