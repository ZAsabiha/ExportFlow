package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.entity.Invoice;
import com.example.exportsystem.entity.InvoiceStatus;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.repository.InvoiceRepository;
import com.example.exportsystem.service.InvoiceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceServiceImpl(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    public List<InvoiceResponse> listByOrder(Long orderId) {
        return invoiceRepository.findByOrder_Id(orderId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<InvoiceResponse> listAll(Pageable pageable) {
        return invoiceRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public Invoice fulfillForOrder(Order order) {
        List<Invoice> existing = invoiceRepository.findByOrder_Id(order.getId());
        Invoice invoice = existing.isEmpty() ? new Invoice() : existing.get(0);

        if (invoice.getId() == null) {
            invoice.setOrder(order);
            invoice.setInvoiceNumber("INV-" + order.getOrderCode() + "-"
                    + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            invoice.setCurrency("USD");
            invoice.setIssueDate(LocalDate.now());
            invoice.setDueDate(LocalDate.now().plusDays(30));
        }

        // Prefer the final agreed amount; fall back to the manager's quote if the order
        // hasn't been formally accepted yet, so the invoice never ships with a blank total.
        BigDecimal amount = (order.getAmount() != null && order.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? order.getAmount() : order.getManagerQuotedPrice();
        if (amount != null) {
            invoice.setAmount(amount);
        } else if (invoice.getAmount() == null) {
            invoice.setAmount(BigDecimal.ZERO);
        }

        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            invoice.setStatus(InvoiceStatus.ISSUED);
        }

        return invoiceRepository.save(invoice);
    }

    private InvoiceResponse toResponse(Invoice i) {
        InvoiceResponse r = new InvoiceResponse();
        r.setId(i.getId());
        r.setOrderCode(i.getOrder().getOrderCode());
        r.setInvoiceNumber(i.getInvoiceNumber());
        r.setAmount(i.getAmount());
        r.setCurrency(i.getCurrency());
        r.setStatus(i.getStatus());
        r.setIssueDate(i.getIssueDate());
        r.setDueDate(i.getDueDate());
        return r;
    }
}
