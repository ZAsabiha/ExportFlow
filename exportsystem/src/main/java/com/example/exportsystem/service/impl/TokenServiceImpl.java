package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.token.GenerateTokenRequest;
import com.example.exportsystem.dto.token.TokenResponse;
import com.example.exportsystem.entity.DownloadToken;
import com.example.exportsystem.entity.DownloadTokenStatus;
import com.example.exportsystem.entity.Invoice;
import com.example.exportsystem.entity.NotificationType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.notification.EmailService;
import com.example.exportsystem.pdf.InvoicePdfService;
import com.example.exportsystem.repository.DownloadTokenRepository;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.service.AuditLogService;
import com.example.exportsystem.service.InvoiceService;
import com.example.exportsystem.service.NotificationService;
import com.example.exportsystem.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TokenServiceImpl implements TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenServiceImpl.class);
    private static final DateTimeFormatter EXPIRY_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

    private final DownloadTokenRepository tokenRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public TokenServiceImpl(DownloadTokenRepository tokenRepository, OrderRepository orderRepository,
                             NotificationService notificationService, InvoiceService invoiceService,
                             InvoicePdfService invoicePdfService, EmailService emailService,
                             AuditLogService auditLogService) {
        this.tokenRepository = tokenRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.invoiceService = invoiceService;
        this.invoicePdfService = invoicePdfService;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    @Override
    public TokenResponse generateToken(GenerateTokenRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + request.getOrderId()));

        DownloadToken token = new DownloadToken();
        token.setToken("TOK-" + order.getOrderCode() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        token.setOrder(order);
        token.setBuyerEmail(request.getBuyerEmail());
        token.setExpiresAt(LocalDateTime.now().plusDays(request.getExpiryDays()));

        DownloadToken saved = tokenRepository.save(token);
        // Notify the buyer's own account regardless of the (optional) contact email the
        // manager typed in - that's who can actually see it on their client dashboard.
        notificationService.notifyClient(order.getBuyerEmail(), order.getOrderCode(),
                "Your trade documents for order " + order.getOrderCode() + " are ready. Download token: " + saved.getToken() + ".",
                NotificationType.DOCUMENT);

        emailInvoice(order, saved);

        auditLogService.log(null, "EXPORT_MANAGER", "Token Generated",
                "Issued download token for order " + order.getOrderCode());

        return toResponse(saved);
    }

    // Issuing a token also fulfils the client-facing invoice: creates/marks it ISSUED and
    // emails the buyer a PDF copy plus the token, mirroring the in-app notification above.
    // Failures here must never fail token creation, which has already been persisted.
    private void emailInvoice(Order order, DownloadToken token) {
        try {
            Invoice invoice = invoiceService.fulfillForOrder(order);
            byte[] pdf = invoicePdfService.generateInvoicePdf(invoice, order, token);
            String subject = "Invoice " + invoice.getInvoiceNumber() + " and download token for order " + order.getOrderCode();
            String body = "Dear " + (order.getBuyerName() != null ? order.getBuyerName() : "Customer") + ",\n\n"
                    + "Please find attached the invoice for order " + order.getOrderCode() + ".\n\n"
                    + "Your trade documents are ready to download using the token below:\n"
                    + "Token: " + token.getToken() + "\n"
                    + "Expires: " + token.getExpiresAt().format(EXPIRY_FMT) + "\n\n"
                    + "Regards,\nExport Management System";
            emailService.sendEmailWithAttachment(order.getBuyerEmail(), subject, body, pdf,
                    "invoice-" + invoice.getInvoiceNumber() + ".pdf");
        } catch (Exception e) {
            log.error("Failed to fulfil/email invoice for order {}: {}", order.getOrderCode(), e.getMessage(), e);
        }
    }

    @Override
    public List<TokenResponse> listByOrder(Long orderId) {
        return tokenRepository.findByOrder_Id(orderId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<TokenResponse> listAll(Pageable pageable) {
        return tokenRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public void revoke(String token) {
        DownloadToken t = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token not found: " + token));
        t.setStatus(DownloadTokenStatus.REVOKED);
        tokenRepository.save(t);
    }

    private TokenResponse toResponse(DownloadToken t) {
        TokenResponse r = new TokenResponse();
        r.setToken(t.getToken());
        r.setOrderCode(t.getOrder().getOrderCode());
        r.setBuyerEmail(t.getBuyerEmail());
        r.setStatus(t.getStatus());
        r.setIssuedAt(t.getIssuedAt());
        r.setExpiresAt(t.getExpiresAt());
        return r;
    }
}
