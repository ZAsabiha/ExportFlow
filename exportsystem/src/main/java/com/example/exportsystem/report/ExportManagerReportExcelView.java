package com.example.exportsystem.report;

import com.example.exportsystem.dto.document.DocumentResponse;
import com.example.exportsystem.dto.invoice.InvoiceResponse;
import com.example.exportsystem.dto.order.OrderResponse;
import com.example.exportsystem.dto.shipment.ShipmentResponse;
import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.OrderStage;
import com.example.exportsystem.entity.PaymentStatus;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.web.servlet.view.document.AbstractXlsxView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

// The Export Manager's full report: one workbook, one sheet per business area, all
// sourced from the same in-memory model built by ReportController so the numbers are
// consistent across sheets (e.g. Buyers totals match what's on the Orders sheet).
public class ExportManagerReportExcelView extends AbstractXlsxView {

    
    private static final Set<DocumentType> REQUIRED_DOCUMENT_TYPES = EnumSet.of(
            DocumentType.COMMERCIAL_INVOICE,
            DocumentType.PACKING_LIST,
            DocumentType.BILL_OF_LADING,
            DocumentType.CERTIFICATE_OF_ORIGIN
    );

    @Override
    protected void buildExcelDocument(Map<String, Object> model, Workbook workbook,
                                       HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Content-Disposition", "attachment; filename=export-manager-report.xlsx");

        @SuppressWarnings("unchecked")
        List<OrderResponse> orders = (List<OrderResponse>) model.get("orders");
        @SuppressWarnings("unchecked")
        List<ShipmentResponse> shipments = (List<ShipmentResponse>) model.get("shipments");
        @SuppressWarnings("unchecked")
        List<InvoiceResponse> invoices = (List<InvoiceResponse>) model.get("invoices");
        @SuppressWarnings("unchecked")
        List<DocumentResponse> documents = (List<DocumentResponse>) model.get("documents");

        CellStyle headerStyle = headerStyle(workbook);

        buildOrdersSheet(workbook, headerStyle, orders);
        buildShipmentsSheet(workbook, headerStyle, shipments);
        buildInvoicesSheet(workbook, headerStyle, invoices);
        buildBuyersSheet(workbook, headerStyle, orders);
        buildDocumentComplianceSheet(workbook, headerStyle, orders, documents);
    }

    private CellStyle headerStyle(Workbook workbook) {
        Font boldFont = workbook.createFont();
        boldFont.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(boldFont);
        return style;
    }

    private Row headerRow(Sheet sheet, CellStyle headerStyle, String... headers) {
        Row header = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        return header;
    }

    private void autoSize(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String orNull(Object value) {
        return value == null ? "" : value.toString();
    }

    private double orZero(BigDecimal value) {
        return value == null ? 0 : value.doubleValue();
    }

    private void buildOrdersSheet(Workbook workbook, CellStyle headerStyle, List<OrderResponse> orders) {
        String[] headers = {
                "Order Code", "Buyer Name", "Product", "Quantity", "Destination", "Target Price",
                "Needed By", "Request Status", "Quoted Price", "Quoted Delivery", "Final Amount",
                "Stage", "Payment Status", "Created At"
        };
        Sheet sheet = workbook.createSheet("Orders");
        headerRow(sheet, headerStyle, headers);

        int rowIdx = 1;
        for (OrderResponse order : orders) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(orNull(order.getOrderCode()));
            row.createCell(1).setCellValue(orNull(order.getBuyerName()));
            row.createCell(2).setCellValue(orNull(order.getProductName()));
            row.createCell(3).setCellValue(order.getQuantity() == null ? 0 : order.getQuantity());
            row.createCell(4).setCellValue(orNull(order.getDestination()));
            row.createCell(5).setCellValue(orZero(order.getTargetPrice()));
            row.createCell(6).setCellValue(orNull(order.getNeededByDate()));
            row.createCell(7).setCellValue(orNull(order.getRequestStatus()));
            row.createCell(8).setCellValue(orZero(order.getManagerQuotedPrice()));
            row.createCell(9).setCellValue(orNull(order.getManagerQuotedDeliveryDate()));
            row.createCell(10).setCellValue(orZero(order.getAmount()));
            row.createCell(11).setCellValue(orNull(order.getStage()));
            row.createCell(12).setCellValue(orNull(order.getPaymentStatus()));
            row.createCell(13).setCellValue(orNull(order.getCreatedAt()));
        }
        autoSize(sheet, headers.length);
    }

    private void buildShipmentsSheet(Workbook workbook, CellStyle headerStyle, List<ShipmentResponse> shipments) {
        String[] headers = {
                "Order Code", "Carrier", "Tracking Number", "Origin Port", "Destination Port",
                "Status", "Estimated Arrival"
        };
        Sheet sheet = workbook.createSheet("Shipments");
        headerRow(sheet, headerStyle, headers);

        int rowIdx = 1;
        for (ShipmentResponse shipment : shipments) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(orNull(shipment.getOrderCode()));
            row.createCell(1).setCellValue(orNull(shipment.getCarrier()));
            row.createCell(2).setCellValue(orNull(shipment.getTrackingNumber()));
            row.createCell(3).setCellValue(orNull(shipment.getOriginPort()));
            row.createCell(4).setCellValue(orNull(shipment.getDestinationPort()));
            row.createCell(5).setCellValue(orNull(shipment.getStatus()));
            row.createCell(6).setCellValue(orNull(shipment.getEstimatedArrival()));
        }
        autoSize(sheet, headers.length);
    }

    private void buildInvoicesSheet(Workbook workbook, CellStyle headerStyle, List<InvoiceResponse> invoices) {
        String[] headers = {
                "Order Code", "Invoice Number", "Amount", "Currency", "Status", "Issue Date", "Due Date"
        };
        Sheet sheet = workbook.createSheet("Invoices");
        headerRow(sheet, headerStyle, headers);

        int rowIdx = 1;
        for (InvoiceResponse invoice : invoices) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(orNull(invoice.getOrderCode()));
            row.createCell(1).setCellValue(orNull(invoice.getInvoiceNumber()));
            row.createCell(2).setCellValue(orZero(invoice.getAmount()));
            row.createCell(3).setCellValue(orNull(invoice.getCurrency()));
            row.createCell(4).setCellValue(orNull(invoice.getStatus()));
            row.createCell(5).setCellValue(orNull(invoice.getIssueDate()));
            row.createCell(6).setCellValue(orNull(invoice.getDueDate()));
        }
        autoSize(sheet, headers.length);
    }

    // One row per unique buyer (grouped by email, falling back to name for buyers with
    // no email on file), aggregated from the same Orders data as the Orders sheet.
    private void buildBuyersSheet(Workbook workbook, CellStyle headerStyle, List<OrderResponse> orders) {
        String[] headers = {
                "Buyer Name", "Total Orders", "Completed Orders", "Pending Payment Orders", "Total Order Value"
        };
        Sheet sheet = workbook.createSheet("Buyers");
        headerRow(sheet, headerStyle, headers);

        Map<String, BuyerSummary> byBuyer = new LinkedHashMap<>();
        for (OrderResponse order : orders) {
            String key = order.getBuyerName() == null ? "Unknown Buyer" : order.getBuyerName();
            BuyerSummary summary = byBuyer.computeIfAbsent(key, BuyerSummary::new);
            summary.totalOrders++;
            if (order.getStage() == OrderStage.COMPLETED) {
                summary.completedOrders++;
            }
            if (order.getPaymentStatus() == PaymentStatus.PENDING) {
                summary.pendingPaymentOrders++;
            }
            if (order.getAmount() != null) {
                summary.totalValue = summary.totalValue.add(order.getAmount());
            }
        }

        int rowIdx = 1;
        for (BuyerSummary summary : byBuyer.values()) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(summary.buyerName);
            row.createCell(1).setCellValue(summary.totalOrders);
            row.createCell(2).setCellValue(summary.completedOrders);
            row.createCell(3).setCellValue(summary.pendingPaymentOrders);
            row.createCell(4).setCellValue(summary.totalValue.doubleValue());
        }
        autoSize(sheet, headers.length);
    }

    // Per-order compliance matrix: which required trade documents are on file, which are
    // still missing, and an overall Yes/No so the manager can filter for at-risk orders.
    private void buildDocumentComplianceSheet(Workbook workbook, CellStyle headerStyle,
                                                List<OrderResponse> orders, List<DocumentResponse> documents) {
        String[] headers = {
                "Order Code", "Buyer Name", "Stage", "Commercial Invoice", "Packing List",
                "Bill Of Lading", "Certificate Of Origin", "Letter Of Credit", "Missing Required Documents",
                "Compliant"
        };
        Sheet sheet = workbook.createSheet("Document Compliance");
        headerRow(sheet, headerStyle, headers);

        Map<String, Set<DocumentType>> docsByOrder = new LinkedHashMap<>();
        for (DocumentResponse doc : documents) {
            docsByOrder.computeIfAbsent(doc.getOrderCode(), k -> EnumSet.noneOf(DocumentType.class))
                    .add(doc.getDocumentType());
        }

        int rowIdx = 1;
        for (OrderResponse order : orders) {
            Set<DocumentType> uploaded = docsByOrder.getOrDefault(order.getOrderCode(), EnumSet.noneOf(DocumentType.class));

            Set<DocumentType> missing = EnumSet.copyOf(REQUIRED_DOCUMENT_TYPES);
            missing.removeAll(uploaded);

            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(orNull(order.getOrderCode()));
            row.createCell(1).setCellValue(orNull(order.getBuyerName()));
            row.createCell(2).setCellValue(orNull(order.getStage()));
            row.createCell(3).setCellValue(uploaded.contains(DocumentType.COMMERCIAL_INVOICE) ? "Yes" : "No");
            row.createCell(4).setCellValue(uploaded.contains(DocumentType.PACKING_LIST) ? "Yes" : "No");
            row.createCell(5).setCellValue(uploaded.contains(DocumentType.BILL_OF_LADING) ? "Yes" : "No");
            row.createCell(6).setCellValue(uploaded.contains(DocumentType.CERTIFICATE_OF_ORIGIN) ? "Yes" : "No");
            row.createCell(7).setCellValue(uploaded.contains(DocumentType.LETTER_OF_CREDIT) ? "Yes" : "No");
            row.createCell(8).setCellValue(missing.isEmpty() ? "" : missing.toString());
            row.createCell(9).setCellValue(missing.isEmpty() ? "Yes" : "No");
        }
        autoSize(sheet, headers.length);
    }

    private static final class BuyerSummary {
        final String buyerName;
        int totalOrders;
        int completedOrders;
        int pendingPaymentOrders;
        BigDecimal totalValue = BigDecimal.ZERO;

        BuyerSummary(String buyerName) {
            this.buyerName = buyerName;
        }
    }
}
