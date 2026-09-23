package com.example.exportsystem.notification;

public interface EmailService {

    void sendPlainTextEmail(String to, String subject, String body);


    void sendEmailWithAttachment(String to, String subject, String body, byte[] attachment, String attachmentFilename);
}
