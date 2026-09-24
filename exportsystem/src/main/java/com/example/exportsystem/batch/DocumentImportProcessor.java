package com.example.exportsystem.batch;

import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.repository.OrderRepository;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;


@Component
@StepScope
public class DocumentImportProcessor implements ItemProcessor<DocumentImportRow, ResolvedDocumentImport>, DisposableBean {

    private final OrderRepository orderRepository;
    private final ZipFile zipFile;

    public DocumentImportProcessor(OrderRepository orderRepository,
                                    @Value("#{jobParameters['zipPath']}") String zipPath) {
        this.orderRepository = orderRepository;
        try {
            this.zipFile = new ZipFile(zipPath);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to open import documents ZIP: " + zipPath, e);
        }
    }

    @Override
    public ResolvedDocumentImport process(DocumentImportRow row) {
        if (row.getOrderCode() == null || row.getOrderCode().isBlank()) {
            throw new RowImportException(row.getRowNumber(), row.getOrderCode(), row.getFileName(), "Missing orderCode");
        }
        if (row.getFileName() == null || row.getFileName().isBlank()) {
            throw new RowImportException(row.getRowNumber(), row.getOrderCode(), row.getFileName(), "Missing fileName");
        }

        DocumentType documentType;
        try {
            String raw = row.getDocumentTypeRaw() == null ? "" : row.getDocumentTypeRaw().trim().toUpperCase(Locale.ROOT);
            documentType = DocumentType.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new RowImportException(row.getRowNumber(), row.getOrderCode(), row.getFileName(),
                    "Unknown documentType: " + row.getDocumentTypeRaw());
        }

        Order order = orderRepository.findByOrderCode(row.getOrderCode())
                .orElseThrow(() -> new RowImportException(row.getRowNumber(), row.getOrderCode(), row.getFileName(),
                        "No order found with code " + row.getOrderCode()));

        ZipEntry entry = zipFile.getEntry(row.getFileName());
        if (entry == null) {
            throw new RowImportException(row.getRowNumber(), row.getOrderCode(), row.getFileName(),
                    "No file named " + row.getFileName() + " in the uploaded ZIP");
        }

        return new ResolvedDocumentImport(order, documentType, entry.getName(), row.getRowNumber(), row.getOrderCode());
    }

    @Override
    public void destroy() throws Exception {
        zipFile.close();
    }
}

