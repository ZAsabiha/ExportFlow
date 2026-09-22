package com.example.exportsystem.dto.client;

import com.example.exportsystem.dto.order.OrderResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// Aggregated numbers the Client Buyer Portal dashboard shows in its stat cards
// (My Purchase Orders / Active Shipments / Invoices / Trade Documents).
public class ClientDashboardResponse {

    private long totalOrders;
    private long activeOrdersCount;          // stage != COMPLETED
    private long ordersInFulfillmentCount;    // stage in (APPROVED, DOCUMENTS, PAID, SHIPMENT)

    private long shipmentsInTransitCount;
    private LocalDate nearestShipmentEta;

    private long invoicesPaidCount;
    private long invoicesDueCount;
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;

    private long unlockedTokensCount;         // ACTIVE download tokens issued for this client's orders
    private long ordersAwaitingTokenCount;    // orders with no ACTIVE token yet

    private List<OrderResponse> recentOrders;

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getActiveOrdersCount() { return activeOrdersCount; }
    public void setActiveOrdersCount(long activeOrdersCount) { this.activeOrdersCount = activeOrdersCount; }

    public long getOrdersInFulfillmentCount() { return ordersInFulfillmentCount; }
    public void setOrdersInFulfillmentCount(long ordersInFulfillmentCount) { this.ordersInFulfillmentCount = ordersInFulfillmentCount; }

    public long getShipmentsInTransitCount() { return shipmentsInTransitCount; }
    public void setShipmentsInTransitCount(long shipmentsInTransitCount) { this.shipmentsInTransitCount = shipmentsInTransitCount; }

    public LocalDate getNearestShipmentEta() { return nearestShipmentEta; }
    public void setNearestShipmentEta(LocalDate nearestShipmentEta) { this.nearestShipmentEta = nearestShipmentEta; }

    public long getInvoicesPaidCount() { return invoicesPaidCount; }
    public void setInvoicesPaidCount(long invoicesPaidCount) { this.invoicesPaidCount = invoicesPaidCount; }

    public long getInvoicesDueCount() { return invoicesDueCount; }
    public void setInvoicesDueCount(long invoicesDueCount) { this.invoicesDueCount = invoicesDueCount; }

    public BigDecimal getTotalPaidAmount() { return totalPaidAmount; }
    public void setTotalPaidAmount(BigDecimal totalPaidAmount) { this.totalPaidAmount = totalPaidAmount; }

    public long getUnlockedTokensCount() { return unlockedTokensCount; }
    public void setUnlockedTokensCount(long unlockedTokensCount) { this.unlockedTokensCount = unlockedTokensCount; }

    public long getOrdersAwaitingTokenCount() { return ordersAwaitingTokenCount; }
    public void setOrdersAwaitingTokenCount(long ordersAwaitingTokenCount) { this.ordersAwaitingTokenCount = ordersAwaitingTokenCount; }

    public List<OrderResponse> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<OrderResponse> recentOrders) { this.recentOrders = recentOrders; }
}
