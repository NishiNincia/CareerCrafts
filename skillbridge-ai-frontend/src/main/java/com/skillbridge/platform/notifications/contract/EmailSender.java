package com.skillbridge.platform.notifications.contract;

/** Contract for outbound transactional email. Default impl uses Spring Mail (SMTP). */
public interface EmailSender {
    void send(String toEmail, String subject, String body);
}
