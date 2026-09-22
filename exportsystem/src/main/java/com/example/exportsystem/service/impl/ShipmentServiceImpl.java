package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.shipment.ShipmentRequest;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.entity.Shipment;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.repository.ShipmentRepository;
import com.example.exportsystem.service.ShipmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;

    public ShipmentServiceImpl(ShipmentRepository shipmentRepository, OrderRepository orderRepository) {
        this.shipmentRepository = shipmentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public ShipmentResponse createShipment(ShipmentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + request.getOrderId()));

        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setCarrier(request.getCarrier());
        shipment.setTrackingNumber(request.getTrackingNumber());
        shipment.setOriginPort(request.getOriginPort());
        shipment.setDestinationPort(request.getDestinationPort());
        shipment.setEstimatedArrival(request.getEstimatedArrival());

        return toResponse(shipmentRepository.save(shipment));
    }

    @Override
    public List<ShipmentResponse> listByOrder(Long orderId) {
        return shipmentRepository.findByOrder_Id(orderId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ShipmentResponse> listAll(Pageable pageable) {
        return shipmentRepository.findAll(pageable).map(this::toResponse);
    }

    private ShipmentResponse toResponse(Shipment s) {
        ShipmentResponse r = new ShipmentResponse();
        r.setId(s.getId());
        r.setOrderCode(s.getOrder().getOrderCode());
        r.setCarrier(s.getCarrier());
        r.setTrackingNumber(s.getTrackingNumber());
        r.setOriginPort(s.getOriginPort());
        r.setDestinationPort(s.getDestinationPort());
        r.setStatus(s.getStatus());
        r.setEstimatedArrival(s.getEstimatedArrival());
        return r;
    }
}
