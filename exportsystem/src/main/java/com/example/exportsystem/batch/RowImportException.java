package com.example.exportsystem.batch;

// Thrown by DocumentImportProcessor/DocumentImportWriter for a row that can't be
// imported (unknown order, bad documentType, missing zip entry). The step is configured
// to skip these rather than fail the whole job - see DocumentImportJobConfig - and
// DocumentImportSkipListener records each one to document_import_errors.
public class RowImportException extends RuntimeException {
    private final Integer rowNumber;
    private final String orderCode;
    private final String fileName;

    public RowImportException(Integer rowNumber, String orderCode, String fileName, String message) {
        super(message);
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
        this.fileName = fileName;
    }

    public Integer getRowNumber() { return rowNumber; }
    public String getOrderCode() { return orderCode; }
    public String getFileName() { return fileName; }
}
