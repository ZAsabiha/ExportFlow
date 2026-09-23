package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.search.SearchResultResponse;
import com.example.exportsystem.dto.search.SearchResultResponse.Type;
import com.example.exportsystem.entity.Invoice;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.entity.Shipment;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.InvoiceRepository;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.repository.ShipmentRepository;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.SearchService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SearchServiceImpl implements SearchService {

    // Results render in a dropdown, not a page - keep each type's slice small so the
    // query stays index-only-scan fast and the list stays scannable at a glance.
    private static final int RESULTS_PER_TYPE = 5;

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    public SearchServiceImpl(OrderRepository orderRepository,
                              ShipmentRepository shipmentRepository,
                              InvoiceRepository invoiceRepository,
                              UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.shipmentRepository = shipmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<SearchResultResponse> searchForClient(User buyer, String query) {
        String q = normalize(query);
        if (q == null) return List.of();
        String buyerName = displayName(buyer);
        Pageable limit = PageRequest.of(0, RESULTS_PER_TYPE);

        List<SearchResultResponse> results = new ArrayList<>();
        orderRepository.searchForBuyer(buyerName, q, limit).forEach(o -> results.add(toResult(o)));
        shipmentRepository.searchForBuyer(buyerName, q, limit).forEach(s -> results.add(toResult(s)));
        invoiceRepository.searchForBuyer(buyerName, q, limit).forEach(i -> results.add(toResult(i)));
        return results;
    }

    @Override
    public List<SearchResultResponse> searchForManager(String query) {
        String q = normalize(query);
        if (q == null) return List.of();
        Pageable limit = PageRequest.of(0, RESULTS_PER_TYPE);

        List<SearchResultResponse> results = new ArrayList<>();
        orderRepository.searchAll(q, limit).forEach(o -> results.add(toResult(o)));
        shipmentRepository.searchAll(q, limit).forEach(s -> results.add(toResult(s)));
        invoiceRepository.searchAll(q, limit).forEach(i -> results.add(toResult(i)));
        return results;
    }

    @Override
    public List<SearchResultResponse> searchForAdmin(String query) {
        String q = normalize(query);
        if (q == null) return List.of();
        Pageable limit = PageRequest.of(0, RESULTS_PER_TYPE);

        List<SearchResultResponse> results = new ArrayList<>();
        orderRepository.searchAll(q, limit).forEach(o -> results.add(toResult(o)));
        shipmentRepository.searchAll(q, limit).forEach(s -> results.add(toResult(s)));
        invoiceRepository.searchAll(q, limit).forEach(i -> results.add(toResult(i)));
        userRepository.search(q, null, limit).forEach(u -> results.add(toResult(u)));
        return results;
    }

    // ---------- helpers ----------

    private String normalize(String query) {
        if (query == null) return null;
        String trimmed = query.trim();
        // Anything shorter is almost always a false-positive-heavy prefix (e.g. "e") that
        // would just return noise across every type - the frontend also debounces, but this
        // guards direct API use too.
        return trimmed.length() < 2 ? null : trimmed;
    }

    private String displayName(User buyer) {
        return (buyer.getUsername() != null && !buyer.getUsername().isBlank())
                ? buyer.getUsername()
                : buyer.getEmail();
    }

    private SearchResultResponse toResult(Order o) {
        return new SearchResultResponse(Type.ORDER, o.getId(), o.getOrderCode(),
                o.getBuyerName() + " • " + o.getProductName(), o.getStage().name());
    }

    private SearchResultResponse toResult(Shipment s) {
        String title = (s.getTrackingNumber() != null && !s.getTrackingNumber().isBlank())
                ? s.getTrackingNumber() : s.getOrder().getOrderCode();
        return new SearchResultResponse(Type.SHIPMENT, s.getId(), title,
                s.getOrder().getOrderCode() + " • " + s.getOrder().getBuyerName(), s.getStatus().name());
    }

    private SearchResultResponse toResult(Invoice i) {
        return new SearchResultResponse(Type.INVOICE, i.getId(), i.getInvoiceNumber(),
                i.getOrder().getOrderCode() + " • " + i.getOrder().getBuyerName(), i.getStatus().name());
    }

    private SearchResultResponse toResult(User u) {
        return new SearchResultResponse(Type.USER, u.getId(), u.getUsername(), u.getEmail(),
                u.isEnabled() ? "ACTIVE" : "INACTIVE");
    }
}
