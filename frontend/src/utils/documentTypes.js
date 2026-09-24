// Trade document types - values mirror the backend DocumentType enum.
export const DOC_TYPES = [
    { label: "Commercial Invoice", value: "COMMERCIAL_INVOICE" },
    { label: "Packing List", value: "PACKING_LIST" },
    { label: "Bill of Lading (B/L)", value: "BILL_OF_LADING" },
    { label: "Certificate of Origin (COO)", value: "CERTIFICATE_OF_ORIGIN" },
    { label: "Letter of Credit (L/C)", value: "LETTER_OF_CREDIT" },
    { label: "Other Document", value: "OTHER" }
];

export function docTypeLabel(value) {
    return DOC_TYPES.find((t) => t.value === value)?.label || value;
}

// Sorted in DOC_TYPES order so lists read the same everywhere.
export function docTypeLabels(values) {
    if (!Array.isArray(values)) return [];
    return DOC_TYPES.filter((t) => values.includes(t.value)).map((t) => t.label);
}

// Toggles one value in a checklist selection array.
export function toggleDocType(selected, value) {
    return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}
