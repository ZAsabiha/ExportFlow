package com.example.exportsystem.batch;

import com.example.exportsystem.service.DocumentService;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.URLConnection;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

// Persists each resolved row exactly like a normal single-file upload would - see
// DocumentService.storeFromStream, shared with DocumentServiceImpl's MultipartFile path.
// Opens its own ZipFile handle (separate from DocumentImportProcessor's) since each
// @StepScope bean gets its own instance; random access by entry name makes that safe.
@Component
@StepScope
public class DocumentImportWriter implements ItemWriter<ResolvedDocumentImport>, DisposableBean {

    private final DocumentService documentService;
    private final ZipFile zipFile;

    public DocumentImportWriter(DocumentService documentService,
                                 @Value("#{jobParameters['zipPath']}") String zipPath) {
        this.documentService = documentService;
        try {
            this.zipFile = new ZipFile(zipPath);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to open import documents ZIP: " + zipPath, e);
        }
    }

    @Override
    public void write(Chunk<? extends ResolvedDocumentImport> chunk) {
        for (ResolvedDocumentImport item : chunk) {
            writeOne(item);
        }
    }

    private void writeOne(ResolvedDocumentImport item) {
        ZipEntry entry = zipFile.getEntry(item.getZipEntryName());
        if (entry == null) {
            // Shouldn't happen - the processor already confirmed this entry exists - but
            // guards against something odd happening to the ZIP mid-job.
            throw new RowImportException(item.getRowNumber(), item.getOrderCode(), item.getZipEntryName(),
                    "File disappeared from ZIP during import: " + item.getZipEntryName());
        }
        String fileName = baseName(item.getZipEntryName());
        String contentType = URLConnection.guessContentTypeFromName(fileName);
        try (InputStream in = zipFile.getInputStream(entry)) {
            documentService.storeFromStream(item.getOrder(), item.getDocumentType(), in,
                    fileName, entry.getSize(), contentType);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read " + item.getZipEntryName() + " from ZIP", e);
        }
    }

    private String baseName(String zipEntryName) {
        int slash = Math.max(zipEntryName.lastIndexOf('/'), zipEntryName.lastIndexOf('\\'));
        return slash >= 0 ? zipEntryName.substring(slash + 1) : zipEntryName;
    }

    @Override
    public void destroy() throws Exception {
        zipFile.close();
    }
}
