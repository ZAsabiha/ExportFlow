package com.example.exportsystem.event;

import com.example.exportsystem.dto.notification.NotificationResponse;
import org.springframework.context.ApplicationEvent;

public class NotificationCreatedEvent extends ApplicationEvent {

    private final String recipientEmail;
    private final String recipientRole;
    private final NotificationResponse notification;

    public NotificationCreatedEvent(Object source, String recipientEmail, String recipientRole,
                                    NotificationResponse notification) {
        super(source);
        this.recipientEmail = recipientEmail;
        this.recipientRole = recipientRole;
        this.notification = notification;
    }

    public String getRecipientEmail() { return recipientEmail; }

    public String getRecipientRole() { return recipientRole; }

    public NotificationResponse getNotification() { return notification; }
}
