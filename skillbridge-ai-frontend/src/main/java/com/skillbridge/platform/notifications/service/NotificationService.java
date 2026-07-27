package com.skillbridge.platform.notifications.service;

import com.skillbridge.platform.notifications.entity.Notification;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    Notification create(UUID userId, Notification.NotificationType type, String title, String body, UUID referenceId,
                         boolean sendEmail, boolean sendPush, String emailAddress);
    List<Notification> getRecent(UUID userId, int page, int size);
    long getUnreadCount(UUID userId);
    void markAsRead(UUID userId, UUID notificationId);
    void markAllAsRead(UUID userId);
}
