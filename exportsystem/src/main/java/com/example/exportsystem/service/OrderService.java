package com.example.exportsystem.service;

import com.example.exportsystem.dto.order.ManagerDeclineRequest;
import com.example.exportsystem.dto.order.ManagerQuoteRequest;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.entity.OrderStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

// The Export Manager's view of orders. Orders always originate as a client request
// (see ClientService.requestOrder) - this service only processes them: respond with a
// quote, decline, or advance an already-accepted order through its pipeline stage.
public interface OrderService {
    Page<OrderResponse> listOrders(Pageable pageable);
    OrderResponse getOrder(Long id);
    OrderResponse quoteOrder(Long id, ManagerQuoteRequest request);
    OrderResponse declineOrder(Long id, ManagerDeclineRequest request);
    OrderResponse advanceStage(Long id, OrderStage nextStage);
}
