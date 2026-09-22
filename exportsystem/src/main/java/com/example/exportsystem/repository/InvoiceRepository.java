package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByOrder_Id(Long orderId);
    List<Invoice> findByOrder_IdInOrderByIssueDateDesc(List<Long> orderIds);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    // Paginated variant for the client's "my invoices" history page - same buyer-name
    // ownership rule used for orders (see OrderRepository).
    Page<Invoice> findByOrder_BuyerNameIgnoreCase(String buyerName, Pageable pageable);
}
