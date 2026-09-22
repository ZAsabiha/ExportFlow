package com.example.exportsystem.service;

import com.example.exportsystem.dto.client.ClientDashboardResponse;
import com.example.exportsystem.dto.client.ClientOrderRequest;
import com.example.exportsystem.dto.client.DocumentUnlockResponse;
import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import com.example.exportsystem.entity.TradeDocument;
import com.example.exportsystem.entity.User;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

// Everything the authenticated CLIENT (buyer) can see or do, always scoped to their own
// orders. The caller is passed in as the resolved User entity (not just the JWT subject)
// so implementations can match on username and/or email - see ClientServiceImpl for how
// "my orders" is derived, since Order has no direct FK back to a buyer's User account.
public interface ClientService {

    ClientDashboardResponse getDashboard(User buyer);

    Page<OrderResponse> listMyOrders(User buyer, Pageable pageable);

    OrderResponse getMyOrder(User buyer, Long orderId);

    OrderResponse requestOrder(User buyer, ClientOrderRequest request);

    // Accepts/rejects the export manager's quote on a pending request. Only valid while
    // the order's requestStatus is QUOTED - see OrderServiceImpl.quoteOrder.
    OrderResponse acceptQuote(User buyer, Long orderId);

    OrderResponse rejectQuote(User buyer, Long orderId);

    Page<NotificationResponse> listMyNotifications(User buyer, Pageable pageable);

    NotificationResponse markNotificationRead(User buyer, Long notificationId);

    Page<ShipmentResponse> listMyShipments(User buyer, Pageable pageable);

    List<ShipmentResponse> listMyShipmentsForOrder(User buyer, Long orderId);

    Page<InvoiceResponse> listMyInvoices(User buyer, Pageable pageable);

    List<InvoiceResponse> listMyInvoicesForOrder(User buyer, Long orderId);

    // Renders the invoice as a PDF for the client to preview/download directly, scoped to
    // one of the caller's own orders. No download token section (see InvoicePdfService) -
    // that only applies to the copy emailed when a token is first issued.
    byte[] getMyInvoicePdf(User buyer, Long invoiceId);

    // Validates the download token and, if it's active/unexpired and tied to one of the
    // caller's orders, returns the trade documents released under it.
    DocumentUnlockResponse unlockDocuments(User buyer, String rawToken);

    // Re-validates the token before streaming the file, so a client can't reuse someone
    // else's document id once they happen to know it.
    TradeDocument resolveDownload(User buyer, Long documentId, String rawToken);

    Resource loadFile(TradeDocument document);
}
