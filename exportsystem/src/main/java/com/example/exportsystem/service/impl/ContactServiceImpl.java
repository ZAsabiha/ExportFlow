package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.contact.ContactRequest;
import com.example.exportsystem.notification.EmailService;
import com.example.exportsystem.service.ContactService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ContactServiceImpl implements ContactService {

    private final EmailService emailService;

    @Value("${app.mail.contact-to}")
    private String supportInbox;

    public ContactServiceImpl(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void submit(ContactRequest request) {
        String subject = "New contact message from " + request.getName();
        String body = "Name: " + request.getName()
                + "\nEmail: " + request.getEmail()
                + "\n\nMessage:\n" + request.getMessage();
        emailService.sendPlainTextEmail(supportInbox, subject, body);

        String confirmationBody = "Hi " + request.getName() + ",\n\n"
                + "Thanks for reaching out - we've received your message and our team will get back to you shortly.\n\n"
                + "Your message:\n" + request.getMessage();
        emailService.sendPlainTextEmail(request.getEmail(), "We've received your message", confirmationBody);
    }
}
