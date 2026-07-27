package com.skillbridge.platform.notifications.impl;

import com.skillbridge.platform.notifications.contract.PushNotificationSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Placeholder push sender - logs instead of calling FCM/APNs. Replace with a real provider bean in production. */
@Slf4j
@Component
public class LoggingPushNotificationSender implements PushNotificationSender {

    @Override
    public void send(UUID userId, String title, String body) {
        log.info("[push-placeholder] user={} title='{}' body='{}'", userId, title, body);
    }
}
