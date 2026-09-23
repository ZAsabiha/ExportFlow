package com.example.exportsystem.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public class FileStorageProperties {

    // Local directory trade documents are saved to. See DocumentService / FileStorageService.
    private String uploadDir = "uploads/trade-documents";

    // Where a bulk-import manifest.xlsx + documents.zip pair is saved while its
    // Spring Batch job runs. See BulkDocumentImportServiceImpl.
    private String importStagingDir = "uploads/import-staging";

    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }

    public String getImportStagingDir() { return importStagingDir; }
    public void setImportStagingDir(String importStagingDir) { this.importStagingDir = importStagingDir; }
}
