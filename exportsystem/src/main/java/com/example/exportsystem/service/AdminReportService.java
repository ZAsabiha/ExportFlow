package com.example.exportsystem.service;

import com.example.exportsystem.dto.report.AdminReportRow;
import com.example.exportsystem.dto.report.AdminReportSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminReportService {

    Page<AdminReportRow> list(String search, String stage, String paymentStatus, Pageable pageable);

    // Every row, unpaginated - used to build the downloadable report from the same view
    // that backs the paginated table.
    List<AdminReportRow> getAll();

    AdminReportSummary getSummary();
}
