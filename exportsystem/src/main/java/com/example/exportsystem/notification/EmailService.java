package com.example.exportsystem.notification;

public interface EmailService {
    // Fire-and-forget notification email. Implementations should not let a
    // mail failure break the calling request (log and swallow, or retry async).
    void sendPlainTextEmail(String to, String subject, String body);

    // Same fire-and-forget contract, with a single PDF attachment (e.g. an invoice).
    void sendEmailWithAttachment(String to, String subject, String body, byte[] attachment, String attachmentFilename);
}
