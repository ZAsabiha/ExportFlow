package com.example.exportsystem.batch;

import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.Order;

// A manifest row that DocumentImportProcessor has successfully resolved against an
// existing Order and confirmed has a matching entry in the ZIP - ready to attach.
public class ResolvedDocumentImport {
    private final Order order;
    private final DocumentType documentType;
    private final String zipEntryName;
    private final int rowNumber;
    private final String orderCode;

    public ResolvedDocumentImport(Order order, DocumentType documentType, String zipEntryName,
                                   int rowNumber, String orderCode) {
        this.order = order;
        this.documentType = documentType;
        this.zipEntryName = zipEntryName;
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
    }

    public Order getOrder() { return order; }
    public DocumentType getDocumentType() { return documentType; }
    public String getZipEntryName() { return zipEntryName; }
    public int getRowNumber() { return rowNumber; }
    public String getOrderCode() { return orderCode; }
}
