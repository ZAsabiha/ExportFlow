package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // Global search - Export Manager/Admin portals: matches invoice number plus the
    // parent order's code and buyer.
    @Query("""
            SELECT i FROM Invoice i JOIN i.order o
            WHERE LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.buyerName) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Invoice> searchAll(@Param("q") String q, Pageable pageable);

    // Global search - Client portal: scoped to the logged-in buyer's own invoices only.
    @Query("""
            SELECT i FROM Invoice i JOIN i.order o
            WHERE LOWER(o.buyerName) = LOWER(:buyerName)
            AND (LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<Invoice> searchForBuyer(@Param("buyerName") String buyerName, @Param("q") String q, Pageable pageable);
}
