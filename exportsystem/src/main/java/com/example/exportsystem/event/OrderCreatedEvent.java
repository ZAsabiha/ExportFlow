package com.example.exportsystem.event;

import com.example.exportsystem.entity.Order;
import org.springframework.context.ApplicationEvent;

// Published whenever a new order is created. Kept separate from OrderService so
// that anything that should react to order creation (email, audit log, etc.)
// can just listen for this event instead of being called from inside the service.
public class OrderCreatedEvent extends ApplicationEvent {

    private final Order order;

    public OrderCreatedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }

    public Order getOrder() { return order; }
}
