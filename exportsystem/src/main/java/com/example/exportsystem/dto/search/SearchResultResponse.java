package com.example.exportsystem.dto.search;

// One hit in the global search dropdown. `type` tells the frontend which icon/section to
// render it under and which portal route to navigate to on click; `title`/`subtitle`/`status`
// are already display-ready strings so the frontend doesn't need type-specific formatting logic.
public class SearchResultResponse {

    public enum Type {
        ORDER, SHIPMENT, INVOICE, USER
    }

    private Type type;
    private Long id;
    private String title;
    private String subtitle;
    private String status;

    public SearchResultResponse() {}

    public SearchResultResponse(Type type, Long id, String title, String subtitle, String status) {
        this.type = type;
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.status = status;
    }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
