package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.order.ManagerDeclineRequest;
import com.example.exportsystem.dto.order.ManagerQuoteRequest;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.entity.NotificationType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.entity.OrderStage;
import com.example.exportsystem.entity.RequestStatus;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.service.AuditLogService;
import com.example.exportsystem.service.NotificationService;
import com.example.exportsystem.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public OrderServiceImpl(OrderRepository orderRepository, NotificationService notificationService, AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    public Page<OrderResponse> listOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public OrderResponse getOrder(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public OrderResponse quoteOrder(Long id, ManagerQuoteRequest request) {
        Order order = findOrThrow(id);
        if (order.getRequestStatus() == RequestStatus.ACCEPTED || order.getRequestStatus() == RequestStatus.REJECTED) {
            throw new IllegalStateException("This request has already been resolved: " + id);
        }
        order.setManagerQuotedPrice(request.getQuotedPrice());
        order.setManagerQuotedDeliveryDate(request.getQuotedDeliveryDate());
        order.setManagerNote(request.getManagerNote());
        order.setRequestStatus(RequestStatus.QUOTED);

        Order saved = orderRepository.save(order);
        notificationService.notifyClient(saved.getBuyerEmail(), saved.getOrderCode(),
                "Your export manager reviewed order " + saved.getOrderCode()
                        + " and sent a quote: " + saved.getManagerQuotedPrice() + " by " + saved.getManagerQuotedDeliveryDate() + ".",
                NotificationType.QUOTE);
        auditLogService.log(null, "EXPORT_MANAGER", "Quote Sent",
                "Sent quote for order " + saved.getOrderCode() + ": " + saved.getManagerQuotedPrice());
        return toResponse(saved);
    }

    @Override
    public OrderResponse declineOrder(Long id, ManagerDeclineRequest request) {
        Order order = findOrThrow(id);
        if (order.getRequestStatus() == RequestStatus.ACCEPTED || order.getRequestStatus() == RequestStatus.REJECTED) {
            throw new IllegalStateException("This request has already been resolved: " + id);
        }
        order.setManagerNote(request.getReason());
        order.setRequestStatus(RequestStatus.REJECTED);

        Order saved = orderRepository.save(order);
        notificationService.notifyClient(saved.getBuyerEmail(), saved.getOrderCode(),
                "Your order request " + saved.getOrderCode() + " could not be fulfilled: " + request.getReason(),
                NotificationType.REJECTION);
        auditLogService.log(null, "EXPORT_MANAGER", "Order Declined",
                "Declined order " + saved.getOrderCode() + ": " + request.getReason());
        return toResponse(saved);
    }

    @Override
    public OrderResponse advanceStage(Long id, OrderStage nextStage) {
        Order order = findOrThrow(id);
        if (order.getRequestStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalStateException("Order " + id + " can't be processed until the client accepts a quote.");
        }
        order.setStage(nextStage);
        return toResponse(orderRepository.save(order));
    }

    private Order findOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));
    }

    private OrderResponse toResponse(Order order) {
        OrderResponse r = new OrderResponse();
        r.setId(order.getId());
        r.setOrderCode(order.getOrderCode());
        r.setBuyerName(order.getBuyerName());
        r.setProductName(order.getProductName());
        r.setQuantity(order.getQuantity());
        r.setDestination(order.getDestination());
        r.setTargetPrice(order.getTargetPrice());
        r.setNeededByDate(order.getNeededByDate());
        r.setItemsDescription(order.getItemsDescription());
        r.setRequestStatus(order.getRequestStatus());
        r.setManagerQuotedPrice(order.getManagerQuotedPrice());
        r.setManagerQuotedDeliveryDate(order.getManagerQuotedDeliveryDate());
        r.setManagerNote(order.getManagerNote());
        r.setAmount(order.getAmount());
        r.setStage(order.getStage());
        r.setPaymentStatus(order.getPaymentStatus());
        r.setCreatedAt(order.getCreatedAt());
        r.setDocumentDeadline(order.getDocumentDeadline());
        r.setDeadlineNote(order.getDeadlineNote());
        r.setRequiredDocuments(order.getRequiredDocuments());
        r.setGovernmentVerified(order.isGovernmentVerified());
        r.setGovernmentVerifiedAt(order.getGovernmentVerifiedAt());
        return r;
    }
}
