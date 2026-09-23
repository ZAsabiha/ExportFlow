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


    Page<Shipment> findByOrder_BuyerNameIgnoreCase(String buyerName, Pageable pageable);

    
    @Query("""
            SELECT s FROM Shipment s JOIN s.order o
            WHERE LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(s.carrier) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerName) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Shipment> searchAll(@Param("q") String q, Pageable pageable);


    @Query("""
            SELECT s FROM Shipment s JOIN s.order o
            WHERE LOWER(o.buyerName) = LOWER(:buyerName)
            AND (LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(s.carrier) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<Shipment> searchForBuyer(@Param("buyerName") String buyerName, @Param("q") String q, Pageable pageable);
}
