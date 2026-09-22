package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.report.AdminReportRow;
import com.example.exportsystem.dto.report.AdminReportSummary;
import com.example.exportsystem.service.AdminReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class AdminReportServiceImpl implements AdminReportService {

    private static final String FROM_VIEW = " FROM admin_report_view";

    private final JdbcTemplate jdbcTemplate;

    public AdminReportServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Page<AdminReportRow> list(String search, String stage, String paymentStatus, Pageable pageable) {
        String safeSearch = (search == null || search.isBlank()) ? null : search.trim().toLowerCase();
        String safeStage = (stage == null || stage.isBlank()) ? null : stage.trim();
        String safePaymentStatus = (paymentStatus == null || paymentStatus.isBlank()) ? null : paymentStatus.trim();

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (safeSearch != null) {
            where.append(" AND (LOWER(order_code) LIKE ? OR LOWER(buyer_name) LIKE ? OR LOWER(buyer_email) LIKE ?"
                    + " OR LOWER(product_name) LIKE ? OR LOWER(created_by_username) LIKE ?)");
            String like = "%" + safeSearch + "%";
            for (int i = 0; i < 5; i++) {
                params.add(like);
            }
        }
        if (safeStage != null) {
            where.append(" AND order_stage = ?");
            params.add(safeStage);
        }
        if (safePaymentStatus != null) {
            where.append(" AND payment_status = ?");
            params.add(safePaymentStatus);
        }

        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*)" + FROM_VIEW + where, Long.class, params.toArray());

        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(pageable.getPageSize());
        pageParams.add(pageable.getOffset());

        List<AdminReportRow> content = jdbcTemplate.query(
                "SELECT *" + FROM_VIEW + where + " ORDER BY order_created_at DESC LIMIT ? OFFSET ?",
                this::mapRow, pageParams.toArray());

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    @Override
    public List<AdminReportRow> getAll() {
        return jdbcTemplate.query("SELECT *" + FROM_VIEW + " ORDER BY order_created_at DESC", this::mapRow);
    }

    @Override
    public AdminReportSummary getSummary() {
        return jdbcTemplate.queryForObject("""
                SELECT
                    COUNT(DISTINCT order_id) AS total_orders,
                    COALESCE(SUM(order_amount), 0) AS total_export_value,
                    COALESCE(SUM(quantity), 0) AS exported_volume,
                    COUNT(DISTINCT CASE WHEN shipment_status IN ('PENDING', 'IN_TRANSIT') THEN order_id END) AS active_shipments,
                    COUNT(DISTINCT CASE WHEN order_stage = 'COMPLETED' THEN order_id END) AS completed_orders,
                    COUNT(DISTINCT CASE WHEN request_status = 'PENDING' THEN order_id END) AS pending_requests,
                    COUNT(DISTINCT CASE WHEN shipment_status = 'DELIVERED' THEN order_id END) AS delivered_shipments,
                    COUNT(DISTINCT CASE WHEN shipment_status = 'DELAYED' THEN order_id END) AS delayed_shipments
                FROM admin_report_view
                """, this::mapSummary);
    }

    private AdminReportRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        AdminReportRow row = new AdminReportRow();
        row.setOrderId(rs.getLong("order_id"));
        row.setOrderCode(rs.getString("order_code"));
        row.setBuyerName(rs.getString("buyer_name"));
        row.setBuyerEmail(rs.getString("buyer_email"));
        row.setProductName(rs.getString("product_name"));
        row.setQuantity((Integer) rs.getObject("quantity"));
        row.setDestination(rs.getString("destination"));
        row.setOrderAmount(rs.getBigDecimal("order_amount"));
        row.setRequestStatus(rs.getString("request_status"));
        row.setOrderStage(rs.getString("order_stage"));
        row.setPaymentStatus(rs.getString("payment_status"));
        row.setOrderCreatedAt(toLocalDateTime(rs, "order_created_at"));
        row.setCreatedByUsername(rs.getString("created_by_username"));
        row.setCreatedByEmail(rs.getString("created_by_email"));

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

    private AdminReportSummary mapSummary(ResultSet rs, int rowNum) throws SQLException {
        AdminReportSummary summary = new AdminReportSummary();
        summary.setTotalOrders(rs.getLong("total_orders"));
        summary.setTotalExportValue(rs.getBigDecimal("total_export_value"));
        summary.setExportedVolume(rs.getLong("exported_volume"));
        summary.setActiveShipments(rs.getLong("active_shipments"));
        summary.setCompletedOrders(rs.getLong("completed_orders"));
        summary.setPendingRequests(rs.getLong("pending_requests"));

        long delivered = rs.getLong("delivered_shipments");
        long delayed = rs.getLong("delayed_shipments");
        long resolved = delivered + delayed;
        summary.setOnTimeDeliveryRate(resolved == 0 ? 100.0 : (delivered * 100.0) / resolved);

        return summary;
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
