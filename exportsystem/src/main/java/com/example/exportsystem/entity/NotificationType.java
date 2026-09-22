package com.example.exportsystem.entity;

// What kind of event a Notification represents, used by the frontend to pick an icon.
// QUOTE: manager sent/updated a price quote to the client.
// ACCEPTANCE: client accepted a quote (notifies managers).
// REJECTION: either side rejected a request/quote.
// DOCUMENT: trade documents/download token became available to the client.
public enum NotificationType {
    QUOTE,
    ACCEPTANCE,
    REJECTION,
    DOCUMENT
}
