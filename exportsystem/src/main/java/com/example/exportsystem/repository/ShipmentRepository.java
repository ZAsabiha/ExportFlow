package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByOrder_Id(Long orderId);
    List<Shipment> findByOrder_IdIn(List<Long> orderIds);

    // Paginated variant for the client's "my shipments" history page - matches the same
    // buyer-name based ownership rule used for orders (see OrderRepository).
    Page<Shipment> findByOrder_BuyerNameIgnoreCase(String buyerName, Pageable pageable);

    // Global search - Export Manager/Admin portals: matches tracking number/carrier plus
    // the parent order's code and buyer, since that's how a shipment is usually looked up.
    @Query("""
            SELECT s FROM Shipment s JOIN s.order o
            WHERE LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(s.carrier) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerName) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Shipment> searchAll(@Param("q") String q, Pageable pageable);

    // Global search - Client portal: scoped to the logged-in buyer's own shipments only.
    @Query("""
            SELECT s FROM Shipment s JOIN s.order o
            WHERE LOWER(o.buyerName) = LOWER(:buyerName)
            AND (LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(s.carrier) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<Shipment> searchForBuyer(@Param("buyerName") String buyerName, @Param("q") String q, Pageable pageable);
}
