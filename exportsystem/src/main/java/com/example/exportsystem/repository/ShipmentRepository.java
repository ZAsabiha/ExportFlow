package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByOrder_Id(Long orderId);
    List<Shipment> findByOrder_IdIn(List<Long> orderIds);

    // Paginated variant for the client's "my shipments" history page - matches the same
    // buyer-name based ownership rule used for orders (see OrderRepository).
    Page<Shipment> findByOrder_BuyerNameIgnoreCase(String buyerName, Pageable pageable);
}
