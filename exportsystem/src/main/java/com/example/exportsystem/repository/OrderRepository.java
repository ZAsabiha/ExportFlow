package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);

    // Used by the Client Portal: orders are matched to the logged-in buyer by
    // display name (Order has no direct FK to User - see ClientServiceImpl).
    List<Order> findByBuyerNameIgnoreCaseOrderByCreatedAtDesc(String buyerName);

    // Paginated variant of the above for the client's "order history" list view; sort is
    // supplied by the caller's Pageable instead of being baked into the query.
    Page<Order> findByBuyerNameIgnoreCase(String buyerName, Pageable pageable);

    // Global search - Export Manager/Admin portals: matches across every field the
    // top-of-page search box promises ("Search orders, buyers, shipments...").
    // The Pageable caller passes in a small fixed limit; this isn't a browsable page.
    @Query("""
            SELECT o FROM Order o
            WHERE LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerEmail) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.productName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.destination) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Order> searchAll(@Param("q") String q, Pageable pageable);

    // Global search - Client portal: same field set, scoped to the logged-in buyer's
    // own orders only.
    @Query("""
            SELECT o FROM Order o
            WHERE LOWER(o.buyerName) = LOWER(:buyerName)
            AND (LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.productName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.destination) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<Order> searchForBuyer(@Param("buyerName") String buyerName, @Param("q") String q, Pageable pageable);
}
