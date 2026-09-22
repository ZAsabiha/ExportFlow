package com.example.exportsystem.dto.report;

import java.math.BigDecimal;

// Aggregate stats over admin_report_view, powering the stat cards on the Admin Reports page.
public class AdminReportSummary {

    private long totalOrders;
    private BigDecimal totalExportValue;
    private long exportedVolume;
    private long activeShipments;
    private long completedOrders;
    private long pendingRequests;
    private double onTimeDeliveryRate;

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public BigDecimal getTotalExportValue() { return totalExportValue; }
    public void setTotalExportValue(BigDecimal totalExportValue) { this.totalExportValue = totalExportValue; }

    public long getExportedVolume() { return exportedVolume; }
    public void setExportedVolume(long exportedVolume) { this.exportedVolume = exportedVolume; }

    public long getActiveShipments() { return activeShipments; }
    public void setActiveShipments(long activeShipments) { this.activeShipments = activeShipments; }

    public long getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(long completedOrders) { this.completedOrders = completedOrders; }

    public long getPendingRequests() { return pendingRequests; }
    public void setPendingRequests(long pendingRequests) { this.pendingRequests = pendingRequests; }

    public double getOnTimeDeliveryRate() { return onTimeDeliveryRate; }
    public void setOnTimeDeliveryRate(double onTimeDeliveryRate) { this.onTimeDeliveryRate = onTimeDeliveryRate; }
}
