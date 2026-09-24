package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.report.AdminReportRow;
import com.example.exportsystem.dto.report.AdminReportSummary;
import com.example.exportsystem.pdf.AdminReportPdfService;
import com.example.exportsystem.service.AdminReportService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final AdminReportService adminReportService;
    private final AdminReportPdfService adminReportPdfService;

    public AdminReportController(AdminReportService adminReportService, AdminReportPdfService adminReportPdfService) {
        this.adminReportService = adminReportService;
        this.adminReportPdfService = adminReportPdfService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminReportRow>> listReports(@RequestParam(defaultValue = "0") int page,
                                                                       @RequestParam(required = false) Integer size,
                                                                       @RequestParam(required = false) String search,
                                                                       @RequestParam(required = false) String stage,
                                                                       @RequestParam(required = false) String paymentStatus) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.ADMIN_REPORTS_PAGE_SIZE, Sort.unsorted());
        return ResponseEntity.ok(PageResponse.of(adminReportService.list(search, stage, paymentStatus, pageable)));
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminReportSummary> summary() {
        return ResponseEntity.ok(adminReportService.getSummary());
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> downloadPdf() {
        byte[] pdf = adminReportPdfService.generateReportPdf(adminReportService.getAll());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=admin-system-report.pdf")
                .body(pdf);
    }
}
