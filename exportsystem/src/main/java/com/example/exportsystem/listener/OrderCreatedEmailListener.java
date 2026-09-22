package com.example.exportsystem.listener;

import com.example.exportsystem.entity.Order;
import com.example.exportsystem.event.OrderCreatedEvent;
import com.example.exportsystem.notification.EmailService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedEmailListener {

    private final EmailService emailService;

    public OrderCreatedEmailListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        Order order = event.getOrder();
        String subject = "New order request pending review: " + order.getOrderCode();
        String body = "A client submitted a new order request awaiting your review.\n\n"
                + "Order: " + order.getOrderCode() + "\n"
                + "Buyer: " + order.getBuyerName() + "\n"
                + "Product: " + order.getProductName() + " (qty " + order.getQuantity() + ")\n"
                + "Destination: " + order.getDestination() + "\n"
                + "Target price: " + order.getTargetPrice() + "\n"
                + "Needed by: " + order.getNeededByDate();

        // TODO: replace with the real recipient (export manager / ops team address),
        // e.g. injected from application.properties or the buyer's contact record.
        String recipient = "ops@exportsystem.local";
        emailService.sendPlainTextEmail(recipient, subject, body);
    }
}
