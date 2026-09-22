package com.example.exportsystem.notification;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@exportsystem.local}")
    private String fromAddress;

    public EmailServiceImpl(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    @Override
    @Async
    public void sendPlainTextEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping email '{}' - no recipient address", subject);
            return;
        }
        if (mailSender == null) {
            log.info("JavaMailSender not configured. Email '{}' to {} was skipped.", subject, to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Sent email '{}' to {}", subject, to);
        } catch (Exception e) {
            // Notification failures must never break the business flow (e.g. order creation).
            log.error("Failed to send email '{}' to {}: {}", subject, to, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendEmailWithAttachment(String to, String subject, String body, byte[] attachment, String attachmentFilename) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping email '{}' - no recipient address", subject);
            return;
        }
        if (mailSender == null) {
            log.info("JavaMailSender not configured. Email '{}' to {} (with attachment) was skipped.", subject, to);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);
            helper.addAttachment(attachmentFilename, new ByteArrayResource(attachment), "application/pdf");
            mailSender.send(message);
            log.info("Sent email '{}' to {} with attachment {}", subject, to, attachmentFilename);
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}: {}", subject, to, e.getMessage());
        }
    }
}
