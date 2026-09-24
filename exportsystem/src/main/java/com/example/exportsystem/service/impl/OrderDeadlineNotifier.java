package com.example.exportsystem.service.impl;

import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.NotificationType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.notification.EmailService;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.NotificationService;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;


@Component
public class OrderDeadlineNotifier {

    private static final String MANAGER_ROLE = "EXPORT_MANAGER";

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public OrderDeadlineNotifier(NotificationService notificationService, UserRepository userRepository,
                                  EmailService emailService) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // " Required documents: Commercial Invoice, Packing List." - or "" when none were specified,
    // so callers can append it to a deadline message unconditionally.
    public static String describeRequiredDocuments(Order order) {
        if (order.getRequiredDocuments() == null || order.getRequiredDocuments().isEmpty()) {
            return "";
        }
        return " Required documents: " + order.getRequiredDocuments().stream()
                .sorted()
                .map(DocumentType::getLabel)
                .collect(Collectors.joining(", ")) + ".";
    }

    public void notifyExportManagers(Order order, String message) {
        notificationService.notifyManagers(order.getOrderCode(), message, NotificationType.DEADLINE);
        String subject = "Document upload deadline - order " + order.getOrderCode();
        for (var manager : userRepository.findDistinctByRoles_Name(MANAGER_ROLE)) {
            emailService.sendPlainTextEmail(manager.getEmail(), subject, message);
        }
    }
}
