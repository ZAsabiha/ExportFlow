package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.service.InvoiceService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export-manager/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<InvoiceResponse>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.INVOICES_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "issueDate"));
        return ResponseEntity.ok(PageResponse.of(invoiceService.listAll(pageable)));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<InvoiceResponse>> listByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.listByOrder(orderId));
    }
}
