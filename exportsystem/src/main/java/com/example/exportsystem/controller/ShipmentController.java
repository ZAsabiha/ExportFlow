package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.shipment.ShipmentRequest;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import com.example.exportsystem.service.ShipmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export-manager/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    public ResponseEntity<ShipmentResponse> create(@Valid @RequestBody ShipmentRequest request) {
        return ResponseEntity.ok(shipmentService.createShipment(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ShipmentResponse>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.SHIPMENTS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(PageResponse.of(shipmentService.listAll(pageable)));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ShipmentResponse>> listByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(shipmentService.listByOrder(orderId));
    }
}
