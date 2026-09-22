package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.report.ExportReportRow;
import com.example.exportsystem.service.ReportService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private static final String SELECT_EXPORT_SUMMARY = "SELECT * FROM export_report_view ORDER BY order_created_at DESC";

    private final JdbcTemplate jdbcTemplate;

    public ReportServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<ExportReportRow> getExportSummary() {
        return jdbcTemplate.query(SELECT_EXPORT_SUMMARY, this::mapRow);
    }

    private ExportReportRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        ExportReportRow row = new ExportReportRow();
        row.setOrderCode(rs.getString("order_code"));
        row.setBuyerName(rs.getString("buyer_name"));
        row.setBuyerEmail(rs.getString("buyer_email"));
        row.setProductName(rs.getString("product_name"));
        row.setQuantity((Integer) rs.getObject("quantity"));
        row.setDestination(rs.getString("destination"));
        row.setOrderAmount(rs.getBigDecimal("order_amount"));
        row.setOrderStage(rs.getString("order_stage"));
        row.setPaymentStatus(rs.getString("payment_status"));
        row.setOrderCreatedAt(toLocalDateTime(rs, "order_created_at"));

        row.setInvoiceNumber(rs.getString("invoice_number"));
        row.setInvoiceAmount(rs.getBigDecimal("invoice_amount"));
        row.setInvoiceCurrency(rs.getString("invoice_currency"));
        row.setInvoiceStatus(rs.getString("invoice_status"));
        row.setInvoiceIssueDate(toLocalDate(rs, "invoice_issue_date"));
        row.setInvoiceDueDate(toLocalDate(rs, "invoice_due_date"));

        row.setShipmentCarrier(rs.getString("shipment_carrier"));
        row.setShipmentTrackingNumber(rs.getString("shipment_tracking_number"));
        row.setShipmentOriginPort(rs.getString("shipment_origin_port"));
        row.setShipmentDestinationPort(rs.getString("shipment_destination_port"));
        row.setShipmentStatus(rs.getString("shipment_status"));
        row.setShipmentEstimatedArrival(toLocalDate(rs, "shipment_estimated_arrival"));

        return row;
    }

    private LocalDate toLocalDate(ResultSet rs, String column) throws SQLException {
        java.sql.Date date = rs.getDate(column);
        return date != null ? date.toLocalDate() : null;
    }

    private LocalDateTime toLocalDateTime(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp timestamp = rs.getTimestamp(column);
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }
}
