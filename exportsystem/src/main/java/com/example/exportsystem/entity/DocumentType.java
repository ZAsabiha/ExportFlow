package com.example.exportsystem.entity;

public enum DocumentType {
    COMMERCIAL_INVOICE("Commercial Invoice"),
    PACKING_LIST("Packing List"),
    BILL_OF_LADING("Bill of Lading (B/L)"),
    CERTIFICATE_OF_ORIGIN("Certificate of Origin (COO)"),
    LETTER_OF_CREDIT("Letter of Credit (L/C)"),
    OTHER("Other Document");

    private final String label;

    DocumentType(String label) {
        this.label = label;
    }

    // Human-readable name for notifications/emails; the enum name is what's persisted.
    public String getLabel() { return label; }
}
