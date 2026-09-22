package com.example.exportsystem.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// One row of the export_report_view: an order joined with its invoice and shipment, if any.
public class ExportReportRow {

    private String orderCode;
    private String buyerName;
    private String buyerEmail;
    private String productName;
    private Integer quantity;
    private String destination;
    private BigDecimal orderAmount;
    private String orderStage;
    private String paymentStatus;
    private LocalDateTime orderCreatedAt;

    private String invoiceNumber;
    private BigDecimal invoiceAmount;
    private String invoiceCurrency;
    private String invoiceStatus;
    private LocalDate invoiceIssueDate;
    private LocalDate invoiceDueDate;

    private String shipmentCarrier;
    private String shipmentTrackingNumber;
    private String shipmentOriginPort;
    private String shipmentDestinationPort;
    private String shipmentStatus;
    private LocalDate shipmentEstimatedArrival;

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public BigDecimal getOrderAmount() { return orderAmount; }
    public void setOrderAmount(BigDecimal orderAmount) { this.orderAmount = orderAmount; }

    public String getOrderStage() { return orderStage; }
    public void setOrderStage(String orderStage) { this.orderStage = orderStage; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDateTime getOrderCreatedAt() { return orderCreatedAt; }
    public void setOrderCreatedAt(LocalDateTime orderCreatedAt) { this.orderCreatedAt = orderCreatedAt; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public BigDecimal getInvoiceAmount() { return invoiceAmount; }
    public void setInvoiceAmount(BigDecimal invoiceAmount) { this.invoiceAmount = invoiceAmount; }

    public String getInvoiceCurrency() { return invoiceCurrency; }
    public void setInvoiceCurrency(String invoiceCurrency) { this.invoiceCurrency = invoiceCurrency; }

    public String getInvoiceStatus() { return invoiceStatus; }
    public void setInvoiceStatus(String invoiceStatus) { this.invoiceStatus = invoiceStatus; }

    public LocalDate getInvoiceIssueDate() { return invoiceIssueDate; }
    public void setInvoiceIssueDate(LocalDate invoiceIssueDate) { this.invoiceIssueDate = invoiceIssueDate; }

    public LocalDate getInvoiceDueDate() { return invoiceDueDate; }
    public void setInvoiceDueDate(LocalDate invoiceDueDate) { this.invoiceDueDate = invoiceDueDate; }

    public String getShipmentCarrier() { return shipmentCarrier; }
    public void setShipmentCarrier(String shipmentCarrier) { this.shipmentCarrier = shipmentCarrier; }

    public String getShipmentTrackingNumber() { return shipmentTrackingNumber; }
    public void setShipmentTrackingNumber(String shipmentTrackingNumber) { this.shipmentTrackingNumber = shipmentTrackingNumber; }

    public String getShipmentOriginPort() { return shipmentOriginPort; }
    public void setShipmentOriginPort(String shipmentOriginPort) { this.shipmentOriginPort = shipmentOriginPort; }

    public String getShipmentDestinationPort() { return shipmentDestinationPort; }
    public void setShipmentDestinationPort(String shipmentDestinationPort) { this.shipmentDestinationPort = shipmentDestinationPort; }

    public String getShipmentStatus() { return shipmentStatus; }
    public void setShipmentStatus(String shipmentStatus) { this.shipmentStatus = shipmentStatus; }

    public LocalDate getShipmentEstimatedArrival() { return shipmentEstimatedArrival; }
    public void setShipmentEstimatedArrival(LocalDate shipmentEstimatedArrival) { this.shipmentEstimatedArrival = shipmentEstimatedArrival; }
}
