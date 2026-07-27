package com.skillbridge.platform.notifications.service.impl;

import com.skillbridge.platform.notifications.contract.EmailSender;
import com.skillbridge.platform.notifications.contract.PushNotificationSender;
import com.skillbridge.platform.notifications.entity.Notification;
import com.skillbridge.platform.notifications.repository.NotificationRepository;
import com.skillbridge.platform.notifications.service.NotificationService;
import com.skillbridge.platform.websocket.service.WebSocketNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailSender emailSender;
    private final PushNotificationSender pushNotificationSender;
    private final WebSocketNotifier webSocketNotifier;

    @Override
    public Notification create(UUID userId, Notification.NotificationType type, String title, String body,
                                UUID referenceId, boolean sendEmail, boolean sendPush, String emailAddress) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setReferenceId(referenceId);

        if (sendEmail && emailAddress != null) {
            emailSender.send(emailAddress, title, body);
            notification.setSentViaEmail(true);
        }
        if (sendPush) {
            pushNotificationSender.send(userId, title, body);
            notification.setSentViaPush(true);
        }

        Notification saved = notificationRepository.save(notification);
        webSocketNotifier.notifyUser(userId, saved);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getRecent(UUID userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public void markAsRead(UUID userId, UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Override
    public void markAllAsRead(UUID userId) {
        notificationRepository.findByUserIdAndReadFalse(userId).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
