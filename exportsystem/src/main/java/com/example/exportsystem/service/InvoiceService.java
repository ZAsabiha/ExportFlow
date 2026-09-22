package com.example.exportsystem.service;

import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.entity.Invoice;
import com.example.exportsystem.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InvoiceService {
    List<InvoiceResponse> listByOrder(Long orderId);
    Page<InvoiceResponse> listAll(Pageable pageable);


    Invoice fulfillForOrder(Order order);
}
