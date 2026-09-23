package com.example.exportsystem.service.impl;

import com.example.exportsystem.config.FileStorageProperties;
import com.example.exportsystem.dto.document.BulkImportStatusResponse;
import com.example.exportsystem.dto.document.DocumentImportErrorResponse;
import com.example.exportsystem.repository.DocumentImportErrorRepository;
import com.example.exportsystem.service.BulkDocumentImportService;
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
public class BulkDocumentImportServiceImpl implements BulkDocumentImportService {

    private final JobLauncher jobLauncher;
    private final Job documentImportJob;
    private final JobExplorer jobExplorer;
    private final JobOperator jobOperator;
    private final DocumentImportErrorRepository errorRepository;
    private final Path stagingRoot;

    public BulkDocumentImportServiceImpl(JobLauncher jobLauncher,
                                          Job documentImportJob,
                                          JobExplorer jobExplorer,
                                          JobOperator jobOperator,
                                          DocumentImportErrorRepository errorRepository,
                                          FileStorageProperties fileStorageProperties) {
        this.jobLauncher = jobLauncher;
        this.documentImportJob = documentImportJob;
        this.jobExplorer = jobExplorer;
        this.jobOperator = jobOperator;
        this.errorRepository = errorRepository;
        this.stagingRoot = Paths.get(fileStorageProperties.getImportStagingDir()).toAbsolutePath().normalize();
    }

    @Override
    public BulkImportStatusResponse launchImport(MultipartFile manifest, MultipartFile documentsZip) {
        Path batchDir = stagingRoot.resolve(UUID.randomUUID().toString());
        try {
            Files.createDirectories(batchDir);
            Path manifestPath = save(manifest, batchDir.resolve("manifest.xlsx"));
            Path zipPath = save(documentsZip, batchDir.resolve("documents.zip"));

            JobParameters params = new JobParametersBuilder()
                    .addString("manifestPath", manifestPath.toString())
                    .addString("zipPath", zipPath.toString())
                    .addLong("timestamp", System.currentTimeMillis())
                    .toJobParameters();

            JobExecution execution = jobLauncher.run(documentImportJob, params);
            return toStatus(execution);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to stage import files", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to launch import job", e);
        }
    }

    @Override
    public BulkImportStatusResponse getStatus(Long jobExecutionId) {
        JobExecution execution = jobExplorer.getJobExecution(jobExecutionId);
        if (execution == null) {
            throw new IllegalArgumentException("No import job found with id: " + jobExecutionId);
        }
        return toStatus(execution);
    }

    @Override
    public Page<DocumentImportErrorResponse> getErrors(Long jobExecutionId, Pageable pageable) {
        return errorRepository.findByJobExecutionId(jobExecutionId, pageable)
                .map(e -> new DocumentImportErrorResponse(e.getRowNumber(), e.getOrderCode(), e.getFileName(), e.getMessage()));
    }

    @Override
    public BulkImportStatusResponse retry(Long jobExecutionId) {
        try {
            Long newExecutionId = jobOperator.restart(jobExecutionId);
            return getStatus(newExecutionId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to restart import job " + jobExecutionId, e);
        }
    }

    private Path save(MultipartFile file, Path target) throws IOException {
        Files.copy(file.getInputStream(), target);
        return target;
    }

    private BulkImportStatusResponse toStatus(JobExecution execution) {
        BulkImportStatusResponse response = new BulkImportStatusResponse();
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
