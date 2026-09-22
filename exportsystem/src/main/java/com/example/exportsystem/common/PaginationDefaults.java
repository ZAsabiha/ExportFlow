package com.example.exportsystem.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;


public final class PaginationDefaults {

    private PaginationDefaults() {
    }

    public static final int ORDERS_PAGE_SIZE = 20;
    public static final int DOCUMENTS_PAGE_SIZE = 10;
    public static final int INVOICES_PAGE_SIZE = 20;
    public static final int SHIPMENTS_PAGE_SIZE = 20;
    public static final int NOTIFICATIONS_PAGE_SIZE = 30;
    public static final int TOKENS_PAGE_SIZE = 10;
    public static final int USERS_PAGE_SIZE = 10;
    public static final int AUDIT_LOGS_PAGE_SIZE = 10;
    public static final int ADMIN_REPORTS_PAGE_SIZE = 20;


    private static final int MAX_PAGE_SIZE = 500;

    public static Pageable pageable(int page, Integer requestedSize, int defaultSize, Sort sort) {
        int safePage = Math.max(page, 0);
        int safeSize = (requestedSize == null || requestedSize <= 0)
                ? defaultSize
                : Math.min(requestedSize, MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize, sort);
    }
}
