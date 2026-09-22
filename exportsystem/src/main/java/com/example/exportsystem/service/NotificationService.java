package com.example.exportsystem.service;

import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.entity.NotificationType;
import com.example.exportsystem.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

// Shared inbox behind both the Client Portal's and the Export Manager's notification bell.
// Client notifications are addressed to one buyer's email; manager notifications are
// addressed to the EXPORT_MANAGER role as a whole (no per-manager assignment exists in
// this system, so it behaves like a shared team inbox).
public interface NotificationService {

    Page<NotificationResponse> listForClient(User buyer, Pageable pageable);

    NotificationResponse markReadForClient(User buyer, Long notificationId);

    Page<NotificationResponse> listForManagers(Pageable pageable);

    NotificationResponse markReadForManagers(Long notificationId);

    void notifyClient(String buyerEmail, String orderCode, String message, NotificationType type);

    void notifyManagers(String orderCode, String message, NotificationType type);
}
