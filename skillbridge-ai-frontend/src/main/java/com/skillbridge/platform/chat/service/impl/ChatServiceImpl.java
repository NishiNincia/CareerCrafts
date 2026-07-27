package com.skillbridge.platform.chat.service.impl;

import com.skillbridge.platform.chat.dto.request.SendMessageRequest;
import com.skillbridge.platform.chat.entity.Conversation;
import com.skillbridge.platform.chat.entity.Message;
import com.skillbridge.platform.chat.repository.ConversationRepository;
import com.skillbridge.platform.chat.repository.MessageRepository;
import com.skillbridge.platform.chat.service.ChatService;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.websocket.service.WebSocketNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final WebSocketNotifier webSocketNotifier;

    @Override
    @Transactional(readOnly = true)
    public List<Conversation> getMyConversations(UUID userId) {
        return conversationRepository.findAllForUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Message> getMessages(UUID userId, UUID conversationId, int page, int size) {
        Conversation conversation = getOwnedConversation(userId, conversationId);
        return messageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversation.getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
    }

    @Override
    public Message sendMessage(UUID senderId, SendMessageRequest request) {
        Conversation conversation = conversationRepository.findBetween(senderId, request.recipientId())
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setParticipantAId(senderId);
                    c.setParticipantBId(request.recipientId());
                    c.setContextId(request.contextId());
                    c.setContextType(request.contextType());
                    return conversationRepository.save(c);
                });

        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderId(senderId);
        message.setContent(request.content());
        message.setAttachmentUrl(request.attachmentUrl());
        message = messageRepository.save(message);

        conversation.setLastMessageAt(Instant.now());
        conversationRepository.save(conversation);

        webSocketNotifier.sendChatMessage(conversation.getId(), message);
        return message;
    }

    @Override
    public void markConversationRead(UUID userId, UUID conversationId) {
        Conversation conversation = getOwnedConversation(userId, conversationId);
        messageRepository.findByConversationIdAndReadFalseAndSenderIdNot(conversation.getId(), userId)
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });
    }

    @Override
    public void sendTypingStatus(UUID conversationId, UUID userId, boolean typing) {
        webSocketNotifier.sendChatMessage(conversationId, Map.of("type", "TYPING", "userId", userId, "typing", typing));
    }

    private Conversation getOwnedConversation(UUID userId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Conversation not found"));
        if (!conversation.getParticipantAId().equals(userId) && !conversation.getParticipantBId().equals(userId)) {
            throw new com.skillbridge.platform.common.exception.ApiException(
                    ErrorCode.ACCESS_DENIED, "You are not a participant in this conversation");
        }
        return conversation;
    }
}
