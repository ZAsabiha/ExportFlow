package com.example.exportsystem.entity;

// Tracks the client <-> export manager negotiation that happens before an order is real:
// PENDING (client submitted, awaiting manager review) -> QUOTED (manager responded with a
// price/timeline) -> ACCEPTED or REJECTED (client's decision on the quote). Only once
// ACCEPTED can the export manager start moving the order through OrderStage.
public enum RequestStatus {
    PENDING,
    QUOTED,
    ACCEPTED,
    REJECTED
}
