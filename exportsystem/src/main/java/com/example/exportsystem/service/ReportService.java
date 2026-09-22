package com.example.exportsystem.service;

import com.example.exportsystem.dto.report.ExportReportRow;

import java.util.List;

public interface ReportService {
    List<ExportReportRow> getExportSummary();
}
