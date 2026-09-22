package com.example.exportsystem.service;

import com.example.exportsystem.dto.shipment.ShipmentRequest;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ShipmentService {
    ShipmentResponse createShipment(ShipmentRequest request);
    List<ShipmentResponse> listByOrder(Long orderId);
    Page<ShipmentResponse> listAll(Pageable pageable);
}
