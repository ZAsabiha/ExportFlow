package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
