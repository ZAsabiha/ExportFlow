package com.example.exportsystem.pdf;

import com.example.exportsystem.dto.report.AdminReportRow;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

// Builds the Admin Portal's downloadable system report from admin_report_view rows - the
// same rows the Admin Reports page's table is populated from (see AdminReportServiceImpl).
@Service
public class AdminReportPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD);
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 7, Font.BOLD, Color.WHITE);
    private static final Font CELL_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL);

    private static final String[] HEADERS = {
            "Order Code", "Buyer", "Created By", "Product", "Order Amount", "Request Status",
            "Stage", "Payment", "Invoice Status", "Shipment Status", "Tracking #", "ETA"
    };

    public byte[] generateReportPdf(List<AdminReportRow> rows) {
        Document document = new Document(PageSize.A4.rotate(), 30, 30, 40, 40);
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("Admin System Report", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph generated = new Paragraph("Generated: " + java.time.LocalDateTime.now().format(
                    DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")), CELL_FONT);
            generated.setAlignment(Element.ALIGN_CENTER);
            document.add(generated);
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(HEADERS.length);
            table.setWidthPercentage(100);

            for (String h : HEADERS) {
                PdfPCell cell = new PdfPCell(new Phrase(h, HEADER_FONT));
                cell.setBackgroundColor(new Color(50, 60, 90));
                cell.setPadding(4);
                table.addCell(cell);
            }

            for (AdminReportRow r : rows) {
                addCell(table, r.getOrderCode());
                addCell(table, r.getBuyerName());
                addCell(table, r.getCreatedByUsername());
                addCell(table, r.getProductName());
                addCell(table, r.getOrderAmount() != null ? r.getOrderAmount().toString() : "-");
                addCell(table, r.getRequestStatus());
                addCell(table, r.getOrderStage());
                addCell(table, r.getPaymentStatus());
                addCell(table, r.getInvoiceStatus());
                addCell(table, r.getShipmentStatus());
                addCell(table, r.getShipmentTrackingNumber());
                addCell(table, r.getShipmentEstimatedArrival() != null ? r.getShipmentEstimatedArrival().format(DATE_FMT) : "-");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Failed to generate admin system report PDF: " + e.getMessage(), e);
        }
    }

    private void addCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value != null ? value : "-", CELL_FONT));
        cell.setPadding(3);
        table.addCell(cell);
    }
}
