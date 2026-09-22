package com.example.exportsystem.controller;

import com.example.exportsystem.pdf.ExportSummaryReportPdfService;
import com.example.exportsystem.report.ExportManagerReportExcelView;
import com.example.exportsystem.service.DocumentService;
import com.example.exportsystem.service.InvoiceService;
import com.example.exportsystem.service.OrderService;
import com.example.exportsystem.service.ReportService;
import com.example.exportsystem.service.ShipmentService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

@RestController
@RequestMapping("/api/export-manager/reports")
public class ReportController {

    private final OrderService orderService;
    private final ShipmentService shipmentService;
    private final InvoiceService invoiceService;
    private final DocumentService documentService;
    private final ReportService reportService;
    private final ExportSummaryReportPdfService exportSummaryReportPdfService;

    public ReportController(OrderService orderService, ShipmentService shipmentService,
                             InvoiceService invoiceService, DocumentService documentService,
                             ReportService reportService,
                             ExportSummaryReportPdfService exportSummaryReportPdfService) {
        this.orderService = orderService;
        this.shipmentService = shipmentService;
        this.invoiceService = invoiceService;
        this.documentService = documentService;
        this.reportService = reportService;
        this.exportSummaryReportPdfService = exportSummaryReportPdfService;
    }


    @GetMapping("/excel")
    public ModelAndView exportManagerExcelReport() {
        Pageable unpaged = Pageable.unpaged(Sort.by(Sort.Direction.DESC, "createdAt"));

        ModelAndView mav = new ModelAndView(new ExportManagerReportExcelView());
        mav.addObject("orders", orderService.listOrders(unpaged).getContent());
        mav.addObject("shipments", shipmentService.listAll(Pageable.unpaged()).getContent());
        mav.addObject("invoices", invoiceService.listAll(Pageable.unpaged()).getContent());
        mav.addObject("documents", documentService.listAll(Pageable.unpaged()).getContent());
        return mav;
    }


    @GetMapping("/export-summary/pdf")
    public ResponseEntity<byte[]> exportSummaryPdf() {
        byte[] pdf = exportSummaryReportPdfService.generateReportPdf(reportService.getExportSummary());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=export-summary-report.pdf")
                .body(pdf);
    }
}
