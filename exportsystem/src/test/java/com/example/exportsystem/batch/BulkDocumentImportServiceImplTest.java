package com.example.exportsystem.batch;

import com.example.exportsystem.dto.document.BulkImportStatusResponse;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.repository.TradeDocumentRepository;
import com.example.exportsystem.service.BulkDocumentImportService;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;

// End-to-end check of the "Excel manifest + ZIP" bulk import: one valid row should
// produce a real TradeDocument, and three deliberately bad rows (unknown order, unknown
// documentType, missing zip entry) should be skipped and reported rather than failing
// the whole job - see DocumentImportProcessor/DocumentImportSkipListener.
@SpringBootTest
class BulkDocumentImportServiceImplTest {

    @Autowired
    private BulkDocumentImportService bulkDocumentImportService;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private TradeDocumentRepository tradeDocumentRepository;

    @Test
    void importsValidRowsAndReportsBadOnesAsSkips() throws Exception {
        Order order = new Order();
        order.setOrderCode("BULK-TEST-1");
        order.setBuyerName("Bulk Test Buyer");
        order.setAmount(BigDecimal.ZERO);
        order = orderRepository.save(order);

        byte[] manifest = buildManifest(
                new String[]{"orderCode", "documentType", "fileName"},
                new String[]{"BULK-TEST-1", "COMMERCIAL_INVOICE", "a.pdf"},
                new String[]{"NOPE-DOES-NOT-EXIST", "PACKING_LIST", "b.pdf"},
                new String[]{"BULK-TEST-1", "NOT_A_REAL_TYPE", "c.pdf"},
                new String[]{"BULK-TEST-1", "OTHER", "missing.pdf"}
        );
        byte[] zip = buildZip("a.pdf", "b.pdf", "c.pdf");

        MockMultipartFile manifestFile = new MockMultipartFile("manifest", "manifest.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", manifest);
        MockMultipartFile zipFile = new MockMultipartFile("documents", "documents.zip", "application/zip", zip);

        BulkImportStatusResponse launched = bulkDocumentImportService.launchImport(manifestFile, zipFile);
        assertThat(launched.getJobExecutionId()).isNotNull();

        BulkImportStatusResponse finalStatus = awaitCompletion(launched.getJobExecutionId());

        assertThat(finalStatus.getStatus()).isEqualTo(BatchStatus.COMPLETED.name());
        assertThat(finalStatus.getSuccessCount()).isEqualTo(1);
        assertThat(finalStatus.getSkippedCount()).isEqualTo(3);

        assertThat(tradeDocumentRepository.findByOrder_Id(order.getId())).hasSize(1);

        var errors = bulkDocumentImportService.getErrors(launched.getJobExecutionId(), PageRequest.of(0, 10));
        assertThat(errors.getTotalElements()).isEqualTo(3);
        assertThat(errors.getContent())
                .extracting(e -> e.getMessage())
                .anyMatch(m -> m.contains("No order found"))
                .anyMatch(m -> m.contains("Unknown documentType"))
                .anyMatch(m -> m.contains("No file named"));
    }

    // documentImportJob runs on a background thread (see BatchLauncherConfig) - poll
    // until it leaves the STARTING/STARTED states instead of asserting immediately.
    private BulkImportStatusResponse awaitCompletion(Long jobExecutionId) throws InterruptedException {
        Instant deadline = Instant.now().plus(Duration.ofSeconds(10));
        BulkImportStatusResponse status;
        do {
            status = bulkDocumentImportService.getStatus(jobExecutionId);
            if (!status.getStatus().equals(BatchStatus.STARTING.name())
                    && !status.getStatus().equals(BatchStatus.STARTED.name())) {
                return status;
            }
            Thread.sleep(50);
        } while (Instant.now().isBefore(deadline));
        return status;
    }

    private byte[] buildManifest(String[] header, String[]... rows) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("manifest");
            writeRow(sheet, 0, header);
            for (int i = 0; i < rows.length; i++) {
                writeRow(sheet, i + 1, rows[i]);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void writeRow(Sheet sheet, int rowNum, String[] values) {
        Row row = sheet.createRow(rowNum);
        for (int i = 0; i < values.length; i++) {
            row.createCell(i).setCellValue(values[i]);
        }
    }

    private byte[] buildZip(String... entryNames) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream(); ZipOutputStream zos = new ZipOutputStream(out)) {
            for (String name : entryNames) {
                zos.putNextEntry(new ZipEntry(name));
                zos.write(("content of " + name).getBytes());
                zos.closeEntry();
            }
            zos.finish();
            return out.toByteArray();
        }
    }
}
