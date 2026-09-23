package com.example.exportsystem.batch;

import com.example.exportsystem.entity.DocumentImportError;
import com.example.exportsystem.repository.DocumentImportErrorRepository;
import org.springframework.batch.core.SkipListener;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.stereotype.Component;

// Records every skipped row (bad order code, bad documentType, missing zip entry, or an
// unexpected I/O failure) to document_import_errors, so the manager can pull a per-row
// report instead of just a pass/fail count. Registered on the step in DocumentImportJobConfig.
@Component
public class DocumentImportSkipListener implements SkipListener<DocumentImportRow, ResolvedDocumentImport>, StepExecutionListener {

    private final DocumentImportErrorRepository errorRepository;
    private Long jobExecutionId;

    public DocumentImportSkipListener(DocumentImportErrorRepository errorRepository) {
        this.errorRepository = errorRepository;
    }

    @Override
    public void beforeStep(StepExecution stepExecution) {
        this.jobExecutionId = stepExecution.getJobExecutionId();
    }

    @Override
    public void onSkipInRead(Throwable t) {
        record(null, null, t);
    }

    @Override
    public void onSkipInProcess(DocumentImportRow item, Throwable t) {
        record(item.getRowNumber(), item.getOrderCode(), t);
    }

    @Override
    public void onSkipInWrite(ResolvedDocumentImport item, Throwable t) {
        record(item.getRowNumber(), item.getOrderCode(), t);
    }

    private void record(Integer rowNumber, String orderCode, Throwable t) {
        DocumentImportError error = new DocumentImportError();
        error.setJobExecutionId(jobExecutionId);
        if (t instanceof RowImportException rie) {
            error.setRowNumber(rie.getRowNumber());
            error.setOrderCode(rie.getOrderCode());
            error.setFileName(rie.getFileName());
            error.setMessage(rie.getMessage());
        } else {
            error.setRowNumber(rowNumber);
            error.setOrderCode(orderCode);
            error.setMessage(t.getClass().getSimpleName() + ": " + t.getMessage());
        }
        errorRepository.save(error);
    }
}
