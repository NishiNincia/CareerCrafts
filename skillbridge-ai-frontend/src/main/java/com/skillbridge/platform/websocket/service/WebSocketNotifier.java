package com.skillbridge.platform.websocket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/** Thin wrapper around SimpMessagingTemplate so other modules don't depend on Spring Messaging directly. */
@Service
@RequiredArgsConstructor
public class WebSocketNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyUser(UUID userId, Object payload) {
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, payload);
    }

    public void sendChatMessage(UUID conversationId, Object payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, payload);
    }

    public void sendLocationUpdate(UUID gigId, Object payload) {
        messagingTemplate.convertAndSend("/topic/tracking/" + gigId, payload);
    }
}
