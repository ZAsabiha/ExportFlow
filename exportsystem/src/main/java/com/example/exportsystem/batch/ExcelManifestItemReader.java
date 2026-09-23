package com.example.exportsystem.batch;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

// Reads the bulk-import manifest (.xlsx) one row at a time. The header row is required
// but column order is not fixed - columns are matched by name. @StepScope + the
// jobParameters SpEL binding mean a fresh reader (and fresh Workbook) is created for
// each job execution, since the manifest path differs every run.
@Component
@StepScope
public class ExcelManifestItemReader implements ItemReader<DocumentImportRow> {

    private static final String COL_ORDER_CODE = "ordercode";
    private static final String COL_DOCUMENT_TYPE = "documenttype";
    private static final String COL_FILE_NAME = "filename";

    private final String manifestPath;
    private final DataFormatter dataFormatter = new DataFormatter();

    private Workbook workbook;
    private Sheet sheet;
    private Map<String, Integer> columnIndex;
    private int nextRowNum;
    private int lastRowNum;

    public ExcelManifestItemReader(@Value("#{jobParameters['manifestPath']}") String manifestPath) {
        this.manifestPath = manifestPath;
    }

    @Override
    public DocumentImportRow read() {
        if (workbook == null) {
            open();
        }
        while (nextRowNum <= lastRowNum) {
            Row row = sheet.getRow(nextRowNum);
            int rowNumber = nextRowNum + 1;
            nextRowNum++;
            if (row == null) {
                continue;
            }
            String orderCode = cellValue(row, columnIndex.get(COL_ORDER_CODE));
            String documentType = cellValue(row, columnIndex.get(COL_DOCUMENT_TYPE));
            String fileName = cellValue(row, columnIndex.get(COL_FILE_NAME));
            if (orderCode == null && documentType == null && fileName == null) {
                continue;
            }
            return new DocumentImportRow(rowNumber, orderCode, documentType, fileName);
        }
        close();
        return null;
    }

    private void open() {
        try {
            workbook = WorkbookFactory.create(new File(manifestPath));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to open import manifest: " + manifestPath, e);
        }
        sheet = workbook.getSheetAt(0);
        lastRowNum = sheet.getLastRowNum();
        columnIndex = readHeader(sheet.getRow(0));
        nextRowNum = 1;
    }

    private void close() {
        try {
            workbook.close();
        } catch (IOException ignored) {
            // Best effort - the staging file is cleaned up once the job completes regardless.
        }
    }

    private Map<String, Integer> readHeader(Row headerRow) {
        Map<String, Integer> index = new HashMap<>();
        if (headerRow == null) {
            return index;
        }
        for (Cell cell : headerRow) {
            String header = dataFormatter.formatCellValue(cell).trim().toLowerCase(Locale.ROOT).replace(" ", "");
            index.put(header, cell.getColumnIndex());
        }
        return index;
    }

    private String cellValue(Row row, Integer column) {
        if (column == null) {
            return null;
        }
        Cell cell = row.getCell(column);
        if (cell == null) {
            return null;
        }
        String value = dataFormatter.formatCellValue(cell).trim();
        return value.isEmpty() ? null : value;
    }
}
