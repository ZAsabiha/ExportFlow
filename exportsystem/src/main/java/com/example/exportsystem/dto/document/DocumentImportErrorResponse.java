package com.example.exportsystem.dto.document;

public class DocumentImportErrorResponse {
    private Integer rowNumber;
    private String orderCode;
    private String fileName;
    private String message;

    public DocumentImportErrorResponse() {}

    public DocumentImportErrorResponse(Integer rowNumber, String orderCode, String fileName, String message) {
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
        this.fileName = fileName;
        this.message = message;
    }

    public Integer getRowNumber() { return rowNumber; }
    public void setRowNumber(Integer rowNumber) { this.rowNumber = rowNumber; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
