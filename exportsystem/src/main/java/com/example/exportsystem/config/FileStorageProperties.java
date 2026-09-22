package com.example.exportsystem.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public class FileStorageProperties {

    // Local directory trade documents are saved to. See DocumentService / FileStorageService.
    private String uploadDir = "uploads/trade-documents";

    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }
}
