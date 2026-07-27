package com.skillbridge.platform.notifications.contract;

import java.util.UUID;

/** Contract for mobile/web push delivery (e.g. FCM). Pluggable so a real provider can be swapped in. */
public interface PushNotificationSender {
    void send(UUID userId, String title, String body);
}
