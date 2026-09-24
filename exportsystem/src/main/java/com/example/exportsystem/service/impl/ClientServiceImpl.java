package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.client.ClientDashboardResponse;
import com.example.exportsystem.dto.client.ClientOrderRequest;
import com.example.exportsystem.dto.client.DocumentUnlockResponse;
import com.example.exportsystem.dto.document.DocumentResponse;
import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import com.example.exportsystem.entity.*;
import com.example.exportsystem.event.OrderCreatedEvent;
import com.example.exportsystem.pdf.InvoicePdfService;
import com.example.exportsystem.repository.*;
import com.example.exportsystem.service.AuditLogService;
import com.example.exportsystem.service.ClientService;
import com.example.exportsystem.service.NotificationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ClientServiceImpl implements ClientService {

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final TradeDocumentRepository documentRepository;
    private final DownloadTokenRepository tokenRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final InvoicePdfService invoicePdfService;
    private final AuditLogService auditLogService;

    public ClientServiceImpl(OrderRepository orderRepository,
                              ShipmentRepository shipmentRepository,
                              InvoiceRepository invoiceRepository,
                              TradeDocumentRepository documentRepository,
                              DownloadTokenRepository tokenRepository,
                              NotificationService notificationService,
                              ApplicationEventPublisher eventPublisher,
                              InvoicePdfService invoicePdfService,
                              AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.shipmentRepository = shipmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.documentRepository = documentRepository;
        this.tokenRepository = tokenRepository;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
        this.invoicePdfService = invoicePdfService;
        this.auditLogService = auditLogService;
    }

    // ---------- Dashboard ----------

    @Override
    public ClientDashboardResponse getDashboard(User buyer) {
        List<Order> myOrders = findMyOrders(buyer);
        List<Long> orderIds = myOrders.stream().map(Order::getId).collect(Collectors.toList());

        ClientDashboardResponse dto = new ClientDashboardResponse();
        dto.setTotalOrders(myOrders.size());
        dto.setActiveOrdersCount(myOrders.stream().filter(o -> o.getStage() != OrderStage.COMPLETED).count());
        dto.setOrdersInFulfillmentCount(myOrders.stream()
                .filter(o -> o.getStage() == OrderStage.APPROVED
                        || o.getStage() == OrderStage.DOCUMENTS
                        || o.getStage() == OrderStage.PAID
                        || o.getStage() == OrderStage.SHIPMENT)
                .count());

        List<Shipment> shipments = orderIds.isEmpty() ? List.of() : shipmentRepository.findByOrder_IdIn(orderIds);
        dto.setShipmentsInTransitCount(shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.IN_TRANSIT).count());
        shipments.stream()
                .filter(s -> s.getStatus() == ShipmentStatus.IN_TRANSIT && s.getEstimatedArrival() != null)
                .map(Shipment::getEstimatedArrival)
                .min(Comparator.naturalOrder())
                .ifPresent(dto::setNearestShipmentEta);

        List<Invoice> invoices = orderIds.isEmpty() ? List.of() : invoiceRepository.findByOrder_IdInOrderByIssueDateDesc(orderIds);
        dto.setInvoicesPaidCount(invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.PAID).count());
        dto.setInvoicesDueCount(invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.ISSUED || i.getStatus() == InvoiceStatus.OVERDUE)
                .count());
        dto.setTotalPaidAmount(invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .map(Invoice::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<DownloadToken> tokens = orderIds.isEmpty() ? List.of() : tokenRepository.findByOrder_IdIn(orderIds);
        long activeTokenOrderCount = tokens.stream()
                .filter(this::isUsable)
                .map(t -> t.getOrder().getId())
                .distinct()
                .count();
        dto.setUnlockedTokensCount(tokens.stream().filter(this::isUsable).count());
        dto.setOrdersAwaitingTokenCount(orderIds.size() - activeTokenOrderCount);

        dto.setRecentOrders(myOrders.stream().limit(5).map(this::toOrderResponse).collect(Collectors.toList()));
        return dto;
    }

    // ---------- Orders ----------

    @Override
    public Page<OrderResponse> listMyOrders(User buyer, Pageable pageable) {
        return orderRepository.findByBuyerNameIgnoreCase(displayName(buyer), pageable).map(this::toOrderResponse);
    }

    @Override
    public OrderResponse getMyOrder(User buyer, Long orderId) {
        return toOrderResponse(findOwnedOrder(buyer, orderId));
    }

    @Override
    @Transactional
    public OrderResponse requestOrder(User buyer, ClientOrderRequest request) {
        Order order = new Order();
        order.setOrderCode(nextOrderCode());
        // The buyer's display name is what links future queries back to this client -
        // see findMyOrders(). Falls back to email if no username was set at registration.
        order.setBuyerName(displayName(buyer));
        order.setBuyerEmail(buyer.getEmail());
        order.setProductName(request.getProductName());
        order.setQuantity(request.getQuantity());
        order.setDestination(request.getDestination());
        order.setTargetPrice(request.getTargetPrice());
        order.setNeededByDate(request.getNeededByDate());
        order.setItemsDescription(request.getItemsDescription());
        order.setRequestStatus(RequestStatus.PENDING);
        order.setAmount(BigDecimal.ZERO); // quote pending - the Export Manager sets the real price
        order.setStage(OrderStage.CREATED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        Order saved = orderRepository.save(order);
        // Lets the export manager's inbox pick up new pending requests - see
        // listener.OrderCreatedEmailListener.
        eventPublisher.publishEvent(new OrderCreatedEvent(this, saved));
        auditLogService.log(buyer.getEmail(), "CLIENT", "Order Requested",
                "Requested order " + saved.getOrderCode() + " (" + saved.getProductName() + ")");
        return toOrderResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse acceptQuote(User buyer, Long orderId) {
        Order order = findOwnedOrder(buyer, orderId);
        if (order.getRequestStatus() != RequestStatus.QUOTED) {
            throw new IllegalStateException("This order has no pending quote to accept.");
        }
        order.setRequestStatus(RequestStatus.ACCEPTED);
        order.setAmount(order.getManagerQuotedPrice());
        Order saved = orderRepository.save(order);
        notificationService.notifyManagers(saved.getOrderCode(),
                displayName(buyer) + " accepted the quote for order " + saved.getOrderCode() + ". Ready to start processing.",
                NotificationType.ACCEPTANCE);
        auditLogService.log(buyer.getEmail(), "CLIENT", "Quote Accepted", "Accepted quote for order " + saved.getOrderCode());
        return toOrderResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse rejectQuote(User buyer, Long orderId) {
        Order order = findOwnedOrder(buyer, orderId);
        if (order.getRequestStatus() != RequestStatus.QUOTED) {
            throw new IllegalStateException("This order has no pending quote to reject.");
        }
        order.setRequestStatus(RequestStatus.REJECTED);
        Order saved = orderRepository.save(order);
        notificationService.notifyManagers(saved.getOrderCode(),
                displayName(buyer) + " rejected the quote for order " + saved.getOrderCode() + ".",
                NotificationType.REJECTION);
        auditLogService.log(buyer.getEmail(), "CLIENT", "Quote Rejected", "Rejected quote for order " + saved.getOrderCode());
        return toOrderResponse(saved);
    }

    // ---------- Notifications ----------

    @Override
    public Page<NotificationResponse> listMyNotifications(User buyer, Pageable pageable) {
        return notificationService.listForClient(buyer, pageable);
    }

    @Override
    @Transactional
    public NotificationResponse markNotificationRead(User buyer, Long notificationId) {
        return notificationService.markReadForClient(buyer, notificationId);
    }

    // ---------- Shipments ----------

    @Override
    public Page<ShipmentResponse> listMyShipments(User buyer, Pageable pageable) {
        return shipmentRepository.findByOrder_BuyerNameIgnoreCase(displayName(buyer), pageable).map(this::toShipmentResponse);
    }

    @Override
    public List<ShipmentResponse> listMyShipmentsForOrder(User buyer, Long orderId) {
        Order order = findOwnedOrder(buyer, orderId);
        return shipmentRepository.findByOrder_Id(order.getId()).stream()
                .map(this::toShipmentResponse)
                .collect(Collectors.toList());
    }

    // ---------- Invoices ----------

    @Override
    public Page<InvoiceResponse> listMyInvoices(User buyer, Pageable pageable) {
        return invoiceRepository.findByOrder_BuyerNameIgnoreCase(displayName(buyer), pageable).map(this::toInvoiceResponse);
    }

    @Override
    public List<InvoiceResponse> listMyInvoicesForOrder(User buyer, Long orderId) {
        Order order = findOwnedOrder(buyer, orderId);
        return invoiceRepository.findByOrder_Id(order.getId()).stream()
                .map(this::toInvoiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public byte[] getMyInvoicePdf(User buyer, Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        Order order = invoice.getOrder();
        if (!isOwnedBy(order, buyer)) {
            // Same message as "not found" - don't confirm a differently-owned invoice id exists.
            throw new IllegalArgumentException("Invoice not found: " + invoiceId);
        }
        return invoicePdfService.generateInvoicePdf(invoice, order, null);
    }

    // ---------- Documents / tokens ----------

    @Override
    @Transactional
    public DocumentUnlockResponse unlockDocuments(User buyer, String rawToken) {
        DownloadToken token = validateTokenForBuyer(buyer, rawToken);

        List<DocumentResponse> documents = documentRepository.findByOrder_Id(token.getOrder().getId()).stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());

        auditLogService.log(buyer.getEmail(), "CLIENT", "Documents Unlocked",
                "Unlocked documents for order " + token.getOrder().getOrderCode() + " via token");
        return new DocumentUnlockResponse(token.getToken(), token.getOrder().getOrderCode(), token.getExpiresAt(), documents);
    }

    @Override
    @Transactional
    public TradeDocument resolveDownload(User buyer, Long documentId, String rawToken) {
        DownloadToken token = validateTokenForBuyer(buyer, rawToken);

        TradeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        if (!doc.getOrder().getId().equals(token.getOrder().getId())) {
            // Deliberately the same message as "not found" - don't confirm the document
            // exists under a different order to a client probing with someone else's token.
            throw new IllegalArgumentException("Document not found: " + documentId);
        }
        return doc;
    }

    @Override
    public Resource loadFile(TradeDocument doc) {
        try {
            Path path = java.nio.file.Paths.get(doc.getFilePath()).normalize();
            Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("File not found or unreadable: " + doc.getOriginalFileName());
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Error resolving file path for document ID: " + doc.getId(), e);
        }
    }

    // ---------- helpers ----------

    private List<Order> findMyOrders(User buyer) {
        return orderRepository.findByBuyerNameIgnoreCaseOrderByCreatedAtDesc(displayName(buyer));
    }

    private Order findOwnedOrder(User buyer, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (!isOwnedBy(order, buyer)) {
            // Same message whether it doesn't exist or belongs to someone else.
            throw new IllegalArgumentException("Order not found: " + orderId);
        }
        return order;
    }

    private boolean isOwnedBy(Order order, User buyer) {
        // Newer orders carry buyerEmail, which is a reliable unique match; older orders
        // (created before this field existed) fall back to the buyerName display match.
        if (order.getBuyerEmail() != null && buyer.getEmail() != null) {
            return order.getBuyerEmail().equalsIgnoreCase(buyer.getEmail());
        }
        return order.getBuyerName() != null && order.getBuyerName().equalsIgnoreCase(displayName(buyer));
    }

    private String displayName(User buyer) {
        return (buyer.getUsername() != null && !buyer.getUsername().isBlank())
                ? buyer.getUsername()
                : buyer.getEmail();
    }

    // A token is usable if it's ACTIVE and hasn't passed its expiry. Lazily flips a
    // stale ACTIVE token to EXPIRED on read instead of running a scheduled sweep job.
    private DownloadToken validateTokenForBuyer(User buyer, String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid download token");
        }
        DownloadToken token = tokenRepository.findByToken(rawToken.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("Invalid download token"));

        if (token.getStatus() == DownloadTokenStatus.REVOKED) {
            throw new IllegalArgumentException("Invalid download token");
        }
        if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(LocalDateTime.now())) {
            if (token.getStatus() != DownloadTokenStatus.EXPIRED) {
                token.setStatus(DownloadTokenStatus.EXPIRED);
                tokenRepository.save(token);
            }
            throw new IllegalArgumentException("Download token has expired");
        }

        Order order = token.getOrder();
        boolean ownsOrder = isOwnedBy(order, buyer);
        boolean matchesEmail = token.getBuyerEmail() != null && buyer.getEmail() != null
                && token.getBuyerEmail().equalsIgnoreCase(buyer.getEmail());
        if (!ownsOrder && !matchesEmail) {
            throw new IllegalArgumentException("Invalid download token");
        }
        return token;
    }

    private boolean isUsable(DownloadToken t) {
        return t.getStatus() == DownloadTokenStatus.ACTIVE
                && (t.getExpiresAt() == null || t.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    private final java.util.concurrent.atomic.AtomicInteger sequence = new java.util.concurrent.atomic.AtomicInteger();

    private String nextOrderCode() {
        long count = orderRepository.count() + sequence.incrementAndGet();
        return String.format("EXP-%04d", 1000 + count);
    }

    private OrderResponse toOrderResponse(Order order) {
        OrderResponse r = new OrderResponse();
        r.setId(order.getId());
        r.setOrderCode(order.getOrderCode());
        r.setBuyerName(order.getBuyerName());
        r.setProductName(order.getProductName());
        r.setQuantity(order.getQuantity());
        r.setDestination(order.getDestination());
        r.setTargetPrice(order.getTargetPrice());
        r.setNeededByDate(order.getNeededByDate());
        r.setItemsDescription(order.getItemsDescription());
        r.setRequestStatus(order.getRequestStatus());
        r.setManagerQuotedPrice(order.getManagerQuotedPrice());
        r.setManagerQuotedDeliveryDate(order.getManagerQuotedDeliveryDate());
        r.setManagerNote(order.getManagerNote());
        r.setAmount(order.getAmount());
        r.setStage(order.getStage());
        r.setPaymentStatus(order.getPaymentStatus());
        r.setCreatedAt(order.getCreatedAt());
        r.setDocumentDeadline(order.getDocumentDeadline());
        r.setDeadlineNote(order.getDeadlineNote());
        r.setRequiredDocuments(order.getRequiredDocuments());
        r.setGovernmentVerified(order.isGovernmentVerified());
        r.setGovernmentVerifiedAt(order.getGovernmentVerifiedAt());
        return r;
    }

    private ShipmentResponse toShipmentResponse(Shipment s) {
        ShipmentResponse r = new ShipmentResponse();
        r.setId(s.getId());
        r.setOrderCode(s.getOrder().getOrderCode());
        r.setCarrier(s.getCarrier());
        r.setTrackingNumber(s.getTrackingNumber());
        r.setOriginPort(s.getOriginPort());
        r.setDestinationPort(s.getDestinationPort());
        r.setStatus(s.getStatus());
        r.setEstimatedArrival(s.getEstimatedArrival());
        return r;
    }

    private InvoiceResponse toInvoiceResponse(Invoice i) {
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

    private DocumentResponse toDocumentResponse(TradeDocument doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getOrder().getOrderCode(),
                doc.getDocumentType(),
                doc.getOriginalFileName(),
                doc.getFileSizeBytes(),
                doc.getUploadedAt()
        );
    }
}
