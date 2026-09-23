package com.example.exportsystem.batch;

// One raw row from the bulk-import manifest, before validation. rowNumber is 1-based,
// matching what a spreadsheet user sees.
public class DocumentImportRow {
    private final int rowNumber;
    private final String orderCode;
    private final String documentTypeRaw;
    private final String fileName;

    public DocumentImportRow(int rowNumber, String orderCode, String documentTypeRaw, String fileName) {
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
        this.documentTypeRaw = documentTypeRaw;
        this.fileName = fileName;
    }

    public int getRowNumber() { return rowNumber; }
    public String getOrderCode() { return orderCode; }
    public String getDocumentTypeRaw() { return documentTypeRaw; }
    public String getFileName() { return fileName; }
}
