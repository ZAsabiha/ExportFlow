package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.entity.Notification;
import com.example.exportsystem.entity.NotificationType;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.event.NotificationCreatedEvent;
import com.example.exportsystem.repository.NotificationRepository;
import com.example.exportsystem.service.NotificationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private static final String MANAGER_ROLE = "EXPORT_MANAGER";

    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   ApplicationEventPublisher eventPublisher) {
        this.notificationRepository = notificationRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public Page<NotificationResponse> listForClient(User buyer, Pageable pageable) {
        return notificationRepository.findByRecipientEmailIgnoreCase(buyer.getEmail(), pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markReadForClient(User buyer, Long notificationId) {
        Notification notification = findOrThrow(notificationId);
        if (notification.getRecipientEmail() == null || buyer.getEmail() == null
                || !notification.getRecipientEmail().equalsIgnoreCase(buyer.getEmail())) {
            throw new IllegalArgumentException("Notification not found: " + notificationId);
        }
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public Page<NotificationResponse> listForManagers(Pageable pageable) {
        return notificationRepository.findByRecipientRole(MANAGER_ROLE, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markReadForManagers(Long notificationId) {
        Notification notification = findOrThrow(notificationId);
        if (!MANAGER_ROLE.equals(notification.getRecipientRole())) {
            throw new IllegalArgumentException("Notification not found: " + notificationId);
        }
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void notifyClient(String buyerEmail, String orderCode, String message, NotificationType type) {
        if (buyerEmail == null || buyerEmail.isBlank()) {
            return;
        }
        Notification notification = new Notification();
        notification.setRecipientEmail(buyerEmail);
        notification.setOrderCode(orderCode);
        notification.setMessage(message);
        notification.setType(type);
        publish(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void notifyManagers(String orderCode, String message, NotificationType type) {
        Notification notification = new Notification();
        notification.setRecipientRole(MANAGER_ROLE);
        notification.setOrderCode(orderCode);
        notification.setMessage(message);
        notification.setType(type);
        publish(notificationRepository.save(notification));
    }

    private void publish(Notification saved) {
        eventPublisher.publishEvent(new NotificationCreatedEvent(this, saved.getRecipientEmail(),
                saved.getRecipientRole(), toResponse(saved)));
    }

    private Notification findOrThrow(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
    }

    private NotificationResponse toResponse(Notification notification) {
        NotificationResponse r = new NotificationResponse();
        r.setId(notification.getId());
        r.setMessage(notification.getMessage());
        r.setType(notification.getType());
        r.setOrderCode(notification.getOrderCode());
        r.setRead(notification.isRead());
        r.setCreatedAt(notification.getCreatedAt());
        return r;
    }
}
