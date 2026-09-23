// Shared "document upload deadline" urgency styling for the Export Manager's Orders and
// Documents pages - red when less than 24h remain (or it's already overdue), matching this
// app's existing red banner convention (background:"#fee2e2", color:"#991b1b").
export function deadlineColors(dueAt) {
    if (!dueAt) return null;
    const hoursLeft = (new Date(dueAt) - Date.now()) / 36e5;
    return hoursLeft < 24
        ? { bg: "#fee2e2", text: "#991b1b" }
        : { bg: "#f1f5f9", text: "#475569" };
}

export function formatDeadline(dueAt) {
    return dueAt ? new Date(dueAt).toLocaleString() : "-";
}
