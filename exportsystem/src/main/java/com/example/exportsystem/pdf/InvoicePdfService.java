package com.example.exportsystem.pdf;

import com.example.exportsystem.entity.DownloadToken;
import com.example.exportsystem.entity.Invoice;
import com.example.exportsystem.entity.Order;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 20, Font.BOLD);
    private static final Font HEADING_FONT = new Font(Font.HELVETICA, 12, Font.BOLD);
    private static final Font BOLD_FONT = new Font(Font.HELVETICA, 10, Font.BOLD);
    private static final Font NORMAL_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL);

    public byte[] generateInvoicePdf(Invoice invoice, Order order, DownloadToken token) {
        Document document = new Document(PageSize.A4, 40, 40, 50, 50);
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("INVOICE", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            PdfPTable header = new PdfPTable(2);
            header.setWidthPercentage(100);
            header.addCell(borderlessCell("Invoice Number: " + invoice.getInvoiceNumber()));
            header.addCell(borderlessCell("Order Code: " + order.getOrderCode()));
            header.addCell(borderlessCell("Issue Date: " + format(invoice.getIssueDate())));
            header.addCell(borderlessCell("Due Date: " + format(invoice.getDueDate())));
            header.addCell(borderlessCell("Status: " + invoice.getStatus()));
            header.addCell(borderlessCell(""));
            document.add(header);
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("Bill To", HEADING_FONT));
            document.add(new Paragraph(order.getBuyerName() != null ? order.getBuyerName() : "-", NORMAL_FONT));
            document.add(new Paragraph(order.getBuyerEmail() != null ? order.getBuyerEmail() : "-", NORMAL_FONT));
            document.add(Chunk.NEWLINE);

            PdfPTable itemsTable = new PdfPTable(4);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{4, 1.5f, 3, 2.5f});
            addHeaderCell(itemsTable, "Product");
            addHeaderCell(itemsTable, "Quantity");
            addHeaderCell(itemsTable, "Destination");
            addHeaderCell(itemsTable, "Amount");

            itemsTable.addCell(new Phrase(order.getProductName() != null ? order.getProductName() : "-", NORMAL_FONT));
            itemsTable.addCell(new Phrase(order.getQuantity() != null ? String.valueOf(order.getQuantity()) : "-", NORMAL_FONT));
            itemsTable.addCell(new Phrase(order.getDestination() != null ? order.getDestination() : "-", NORMAL_FONT));
            itemsTable.addCell(new Phrase(invoice.getCurrency() + " " + invoice.getAmount(), NORMAL_FONT));
            document.add(itemsTable);
            document.add(Chunk.NEWLINE);

            Paragraph total = new Paragraph("Total Due: " + invoice.getCurrency() + " " + invoice.getAmount(), HEADING_FONT);
            total.setAlignment(Element.ALIGN_RIGHT);
            document.add(total);
            document.add(Chunk.NEWLINE);

            // Only shown on the copy emailed alongside a freshly issued download token -
            // a standalone preview/download from the invoice list has no token to report.
            if (token != null) {
                document.add(Chunk.NEWLINE);
                document.add(new Paragraph("Document Access", HEADING_FONT));
                document.add(new Paragraph("A secure download token has been issued for the trade documents on this order.", NORMAL_FONT));
                document.add(new Paragraph("Token: " + token.getToken(), BOLD_FONT));
                document.add(new Paragraph("Expires: " + token.getExpiresAt().format(DATETIME_FMT), NORMAL_FONT));
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Failed to generate invoice PDF: " + e.getMessage(), e);
        }
    }

    private String format(java.time.LocalDate date) {
        return date != null ? date.format(DATE_FMT) : "-";
    }

    private PdfPCell borderlessCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, BOLD_FONT));
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, BOLD_FONT));
        cell.setBackgroundColor(new Color(230, 230, 230));
        table.addCell(cell);
    }
}
