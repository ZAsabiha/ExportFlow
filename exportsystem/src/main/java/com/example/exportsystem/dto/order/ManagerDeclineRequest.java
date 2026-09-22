package com.example.exportsystem.dto.order;

import jakarta.validation.constraints.NotBlank;

// Submitted by the Export Manager to decline a pending request outright (e.g. no
// supplier can meet the price or timeline) without ever sending the client a quote.
public class ManagerDeclineRequest {

    @NotBlank
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
