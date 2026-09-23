package com.example.exportsystem.batch;

import com.example.exportsystem.entity.TokenGenerationError;
import com.example.exportsystem.repository.TokenGenerationErrorRepository;
import org.springframework.batch.core.SkipListener;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.stereotype.Component;

// Records every skipped row (bad order code, bad expiryDays, or a failed token issuance)
// to token_generation_errors, so the manager can pull a per-row report instead of just a
// pass/fail count. Registered on the step in TokenGenerationJobConfig.
@Component
public class TokenGenerationSkipListener implements SkipListener<TokenGenerationRow, ResolvedTokenGeneration>, StepExecutionListener {

    private final TokenGenerationErrorRepository errorRepository;
    private Long jobExecutionId;

    public TokenGenerationSkipListener(TokenGenerationErrorRepository errorRepository) {
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
    public void onSkipInProcess(TokenGenerationRow item, Throwable t) {
        record(item.getRowNumber(), item.getOrderCode(), t);
    }

    @Override
    public void onSkipInWrite(ResolvedTokenGeneration item, Throwable t) {
        record(item.getRowNumber(), item.getOrderCode(), t);
    }

    private void record(Integer rowNumber, String orderCode, Throwable t) {
        TokenGenerationError error = new TokenGenerationError();
        error.setJobExecutionId(jobExecutionId);
        if (t instanceof RowTokenGenerationException rte) {
            error.setRowNumber(rte.getRowNumber());
            error.setOrderCode(rte.getOrderCode());
            error.setMessage(rte.getMessage());
        } else {
            error.setRowNumber(rowNumber);
            error.setOrderCode(orderCode);
            error.setMessage(t.getClass().getSimpleName() + ": " + t.getMessage());
        }
        errorRepository.save(error);
    }
}
