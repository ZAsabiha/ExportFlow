package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.client.ClientDashboardResponse;
import com.example.exportsystem.dto.client.ClientOrderRequest;
import com.example.exportsystem.dto.client.DocumentUnlockRequest;
import com.example.exportsystem.dto.client.DocumentUnlockResponse;
import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import com.example.exportsystem.entity.TradeDocument;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.notification.NotificationStreamService;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;


@RestController
@RequestMapping("/api/client")
public class ClientController {

    private final ClientService clientService;
    private final UserRepository userRepository;
    private final NotificationStreamService notificationStreamService;

    public ClientController(ClientService clientService, UserRepository userRepository,
                            NotificationStreamService notificationStreamService) {
        this.clientService = clientService;
        this.userRepository = userRepository;
        this.notificationStreamService = notificationStreamService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ClientDashboardResponse> dashboard(Authentication authentication) {
        return ResponseEntity.ok(clientService.getDashboard(currentUser(authentication)));
    }

    // ---------- Orders ----------

    @GetMapping("/orders")
    public ResponseEntity<PageResponse<OrderResponse>> myOrders(Authentication authentication,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.ORDERS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(clientService.listMyOrders(currentUser(authentication), pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponse> myOrder(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(clientService.getMyOrder(currentUser(authentication), id));
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> requestOrder(Authentication authentication,
                                                        @Valid @RequestBody ClientOrderRequest request) {
        return ResponseEntity.ok(clientService.requestOrder(currentUser(authentication), request));
    }

    @PostMapping("/orders/{id}/accept")
    public ResponseEntity<OrderResponse> acceptQuote(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(clientService.acceptQuote(currentUser(authentication), id));
    }

    @PostMapping("/orders/{id}/reject")
    public ResponseEntity<OrderResponse> rejectQuote(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(clientService.rejectQuote(currentUser(authentication), id));
    }

    // ---------- Notifications ----------

    @GetMapping("/notifications")
    public ResponseEntity<PageResponse<NotificationResponse>> myNotifications(Authentication authentication,
                                                                                 @RequestParam(defaultValue = "0") int page,
                                                                                 @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.NOTIFICATIONS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(clientService.listMyNotifications(currentUser(authentication), pageable)));
    }

    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter notificationStream(Authentication authentication) {
        return notificationStreamService.subscribeClient(currentUser(authentication).getEmail());
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<NotificationResponse> markNotificationRead(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(clientService.markNotificationRead(currentUser(authentication), id));
    }

    // ---------- Shipments ----------

    @GetMapping("/shipments")
    public ResponseEntity<PageResponse<ShipmentResponse>> myShipments(Authentication authentication,
                                                                         @RequestParam(defaultValue = "0") int page,
                                                                         @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.SHIPMENTS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(PageResponse.of(clientService.listMyShipments(currentUser(authentication), pageable)));
    }

    @GetMapping("/shipments/order/{orderId}")
    public ResponseEntity<List<ShipmentResponse>> myShipmentsForOrder(Authentication authentication, @PathVariable Long orderId) {
        return ResponseEntity.ok(clientService.listMyShipmentsForOrder(currentUser(authentication), orderId));
    }

    // ---------- Invoices ----------

    @GetMapping("/invoices")
    public ResponseEntity<PageResponse<InvoiceResponse>> myInvoices(Authentication authentication,
                                                                       @RequestParam(defaultValue = "0") int page,
                                                                       @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.INVOICES_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "issueDate"));
        return ResponseEntity.ok(PageResponse.of(clientService.listMyInvoices(currentUser(authentication), pageable)));
    }

    @GetMapping("/invoices/order/{orderId}")
    public ResponseEntity<List<InvoiceResponse>> myInvoicesForOrder(Authentication authentication, @PathVariable Long orderId) {
        return ResponseEntity.ok(clientService.listMyInvoicesForOrder(currentUser(authentication), orderId));
    }

    // "inline" (not "attachment") lets the browser render the PDF directly when opened in a
    // new tab; the frontend fetches this as a blob either way and decides preview vs. download.
    @GetMapping("/invoices/{id}/pdf")
    public ResponseEntity<byte[]> myInvoicePdf(Authentication authentication, @PathVariable Long id) {
        byte[] pdf = clientService.getMyInvoicePdf(currentUser(authentication), id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=invoice-" + id + ".pdf")
                .body(pdf);
    }

    // ---------- Trade documents / download tokens ----------

    // Verifies a Download Token issued by the Export Manager and, if valid, returns the
    // list of trade documents it unlocks for that order.
    @PostMapping("/documents/unlock")
    public ResponseEntity<DocumentUnlockResponse> unlockDocuments(Authentication authentication,
                                                                    @Valid @RequestBody DocumentUnlockRequest request) {
        return ResponseEntity.ok(clientService.unlockDocuments(currentUser(authentication), request.getToken()));
    }

   
    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> downloadDocument(Authentication authentication,
                                                       @PathVariable Long id,
                                                       @RequestParam String token) {
        User buyer = currentUser(authentication);
        TradeDocument doc = clientService.resolveDownload(buyer, id, token);
        Resource resource = clientService.loadFile(doc);

        String contentType = doc.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getOriginalFileName() + "\"")
                .body(resource);
    }


    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
    }
}