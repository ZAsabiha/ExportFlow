package com.example.exportsystem.dto.admin;

import java.time.LocalDateTime;
import java.util.Map;

public class AdminDashboardSummary {

    private long totalUsers;
    private long activeTokens;
    private double activeTokenRate;
    private long totalAuditLogs;
    private LocalDateTime lastAuditLogAt;
    private Map<String, Long> activeAccountsByRole;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getActiveTokens() { return activeTokens; }
    public void setActiveTokens(long activeTokens) { this.activeTokens = activeTokens; }

    public double getActiveTokenRate() { return activeTokenRate; }
    public void setActiveTokenRate(double activeTokenRate) { this.activeTokenRate = activeTokenRate; }

    public long getTotalAuditLogs() { return totalAuditLogs; }
    public void setTotalAuditLogs(long totalAuditLogs) { this.totalAuditLogs = totalAuditLogs; }

    public LocalDateTime getLastAuditLogAt() { return lastAuditLogAt; }
    public void setLastAuditLogAt(LocalDateTime lastAuditLogAt) { this.lastAuditLogAt = lastAuditLogAt; }

    public Map<String, Long> getActiveAccountsByRole() { return activeAccountsByRole; }
    public void setActiveAccountsByRole(Map<String, Long> activeAccountsByRole) { this.activeAccountsByRole = activeAccountsByRole; }
}
