package com.example.exportsystem.scheduler;

import com.example.exportsystem.entity.Order;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.service.AuditLogService;
import com.example.exportsystem.service.impl.OrderDeadlineNotifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Component
public class DeadlineReminderScheduler {

    private final OrderRepository orderRepository;
    private final OrderDeadlineNotifier deadlineNotifier;
    private final AuditLogService auditLogService;

    public DeadlineReminderScheduler(OrderRepository orderRepository, OrderDeadlineNotifier deadlineNotifier,
                                      AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.deadlineNotifier = deadlineNotifier;
        this.auditLogService = auditLogService;
    }

    @Scheduled(fixedRateString = "${app.scheduling.deadline-reminder.fixed-rate-ms:1800000}")
    @Transactional
    public void checkUpcomingDeadlines() {
        LocalDateTime cutoff = LocalDateTime.now().plusHours(24);
        List<Order> dueSoon = orderRepository
                .findByDocumentDeadlineNotNullAndDocumentDeadlineLessThanEqualAndDeadlineReminderSentFalse(cutoff);

        for (Order order : dueSoon) {
            String message = "Reminder: order " + order.getOrderCode() + " has a document upload deadline of "
                    + order.getDocumentDeadline() + " - less than 24 hours remain.";
            deadlineNotifier.notifyExportManagers(order, message);
            order.setDeadlineReminderSent(true);
            orderRepository.save(order);
            auditLogService.log(null, "SYSTEM", "Deadline Reminder Sent",
                    "Sent approaching-deadline reminder for order " + order.getOrderCode());
        }
    }
}
