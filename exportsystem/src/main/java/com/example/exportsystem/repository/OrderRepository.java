package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);


    List<Order> findByBuyerNameIgnoreCaseOrderByCreatedAtDesc(String buyerName);


    Page<Order> findByBuyerNameIgnoreCase(String buyerName, Pageable pageable);

 
    @Query("""
            SELECT o FROM Order o
            WHERE LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerEmail) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.productName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.destination) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Order> searchAll(@Param("q") String q, Pageable pageable);


    @Query("""
            SELECT o FROM Order o
            WHERE LOWER(o.buyerName) = LOWER(:buyerName)
            AND (LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.productName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.destination) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<Order> searchForBuyer(@Param("buyerName") String buyerName, @Param("q") String q, Pageable pageable);

    // Powers the deadline reminder scheduler: orders with a deadline at or before the cutoff
    // (now + 24h, so this also catches ones already overdue) that haven't been reminded yet.
    List<Order> findByDocumentDeadlineNotNullAndDocumentDeadlineLessThanEqualAndDeadlineReminderSentFalse(LocalDateTime cutoff);
}
