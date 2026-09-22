package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.service.NotificationService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/export-manager/notifications")
@PreAuthorize("hasRole('EXPORT_MANAGER')")
public class ManagerNotificationController {

    private final NotificationService notificationService;

    public ManagerNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<NotificationResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.NOTIFICATIONS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(notificationService.listForManagers(pageable)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markReadForManagers(id));
    }
}
