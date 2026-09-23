package com.example.exportsystem.service.impl;

import com.example.exportsystem.config.FileStorageProperties;
import com.example.exportsystem.dto.token.BulkTokenGenerationStatusResponse;
import com.example.exportsystem.dto.token.TokenGenerationErrorResponse;
import com.example.exportsystem.repository.TokenGenerationErrorRepository;
import com.example.exportsystem.service.BulkTokenGenerationService;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class BulkTokenGenerationServiceImpl implements BulkTokenGenerationService {

    private final JobLauncher jobLauncher;
    private final Job tokenGenerationJob;
    private final JobExplorer jobExplorer;
    private final JobOperator jobOperator;
    private final TokenGenerationErrorRepository errorRepository;
    private final Path stagingRoot;

    public BulkTokenGenerationServiceImpl(JobLauncher jobLauncher,
                                           Job tokenGenerationJob,
                                           JobExplorer jobExplorer,
                                           JobOperator jobOperator,
                                           TokenGenerationErrorRepository errorRepository,
                                           FileStorageProperties fileStorageProperties) {
        this.jobLauncher = jobLauncher;
        this.tokenGenerationJob = tokenGenerationJob;
        this.jobExplorer = jobExplorer;
        this.jobOperator = jobOperator;
        this.errorRepository = errorRepository;
        this.stagingRoot = Paths.get(fileStorageProperties.getImportStagingDir()).toAbsolutePath().normalize();
    }

    @Override
    public BulkTokenGenerationStatusResponse launchGeneration(MultipartFile manifest) {
        Path batchDir = stagingRoot.resolve(UUID.randomUUID().toString());
        try {
            Files.createDirectories(batchDir);
            Path manifestPath = save(manifest, batchDir.resolve("manifest.xlsx"));

            JobParameters params = new JobParametersBuilder()
                    .addString("manifestPath", manifestPath.toString())
                    .addLong("timestamp", System.currentTimeMillis())
                    .toJobParameters();

            JobExecution execution = jobLauncher.run(tokenGenerationJob, params);
            return toStatus(execution);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to stage token generation manifest", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to launch token generation job", e);
        }
    }

    @Override
    public BulkTokenGenerationStatusResponse getStatus(Long jobExecutionId) {
        JobExecution execution = jobExplorer.getJobExecution(jobExecutionId);
        if (execution == null) {
            throw new IllegalArgumentException("No token generation job found with id: " + jobExecutionId);
        }
        return toStatus(execution);
    }

    @Override
    public Page<TokenGenerationErrorResponse> getErrors(Long jobExecutionId, Pageable pageable) {
        return errorRepository.findByJobExecutionId(jobExecutionId, pageable)
                .map(e -> new TokenGenerationErrorResponse(e.getRowNumber(), e.getOrderCode(), e.getMessage()));
    }

    @Override
    public BulkTokenGenerationStatusResponse retry(Long jobExecutionId) {
        try {
            Long newExecutionId = jobOperator.restart(jobExecutionId);
            return getStatus(newExecutionId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to restart token generation job " + jobExecutionId, e);
        }
    }

    private Path save(MultipartFile file, Path target) throws IOException {
        Files.copy(file.getInputStream(), target);
        return target;
    }

    private BulkTokenGenerationStatusResponse toStatus(JobExecution execution) {
        BulkTokenGenerationStatusResponse response = new BulkTokenGenerationStatusResponse();
        response.setJobExecutionId(execution.getId());
        response.setStatus(execution.getStatus().name());
        response.setExitDescription(execution.getExitStatus().getExitDescription());

        long read = 0;
        long written = 0;
        long skipped = 0;
        for (StepExecution step : execution.getStepExecutions()) {
            read += step.getReadCount();
            written += step.getWriteCount();
            skipped += step.getSkipCount();
        }
        response.setReadCount(read);
        response.setSuccessCount(written);
        response.setSkippedCount(skipped);
        response.setStartTime(execution.getStartTime());
        response.setEndTime(execution.getEndTime());
        return response;
    }
}
