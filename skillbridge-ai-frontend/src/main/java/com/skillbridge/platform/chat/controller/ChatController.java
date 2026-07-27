package com.skillbridge.platform.chat.controller;

import com.skillbridge.platform.chat.dto.request.SendMessageRequest;
import com.skillbridge.platform.chat.entity.Conversation;
import com.skillbridge.platform.chat.entity.Message;
import com.skillbridge.platform.chat.service.ChatService;
import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Conversations and messages (also delivered realtime over WebSocket/STOMP)")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public ApiResponse<List<Conversation>> myConversations() {
        return ApiResponse.success(chatService.getMyConversations(CurrentUserId.get()));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<List<Message>> messages(@PathVariable UUID conversationId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success(chatService.getMessages(CurrentUserId.get(), conversationId, page, size));
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Message> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.success(chatService.sendMessage(CurrentUserId.get(), request));
    }

    @PatchMapping("/conversations/{conversationId}/read")
    public ApiResponse<Void> markRead(@PathVariable UUID conversationId) {
        chatService.markConversationRead(CurrentUserId.get(), conversationId);
        return ApiResponse.success("Conversation marked as read", null);
    }
}
