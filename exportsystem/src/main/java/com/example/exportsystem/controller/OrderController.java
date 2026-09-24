package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.order.ManagerDeclineRequest;
import com.example.exportsystem.dto.order.ManagerQuoteRequest;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.entity.OrderStage;
import com.example.exportsystem.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// The Export Manager's order-processing API. Orders always originate as a client request
// (POST /api/client/orders) - managers here only review, quote, decline, or advance
// requests the client has already accepted. See OrderService for the workflow rules.
@RestController
@RequestMapping("/api/export-manager/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<OrderResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.ORDERS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(orderService.listOrders(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PostMapping("/{id}/quote")
    public ResponseEntity<OrderResponse> quote(@PathVariable Long id, @Valid @RequestBody ManagerQuoteRequest request) {
        return ResponseEntity.ok(orderService.quoteOrder(id, request));
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<OrderResponse> decline(@PathVariable Long id, @Valid @RequestBody ManagerDeclineRequest request) {
        return ResponseEntity.ok(orderService.declineOrder(id, request));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<OrderResponse> advanceStage(@PathVariable Long id, @RequestParam OrderStage stage) {
        return ResponseEntity.ok(orderService.advanceStage(id, stage));
    }
}
