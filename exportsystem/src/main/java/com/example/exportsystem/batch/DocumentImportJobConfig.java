package com.example.exportsystem.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.SkipListener;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

// documentImportJob: the bulk "Excel manifest + ZIP" document import. One step, chunked
// so tens of thousands of rows commit incrementally instead of in one giant transaction,
// and fault-tolerant so a bad row (see RowImportException) is skipped and reported
// rather than failing the whole import - see DocumentImportSkipListener.
@Configuration
public class DocumentImportJobConfig {

    private static final int CHUNK_SIZE = 200;

    @Bean
    public Job documentImportJob(JobRepository jobRepository, Step documentImportStep) {
        return new JobBuilder("documentImportJob", jobRepository)
                .start(documentImportStep)
                .build();
    }

    @Bean
    public Step documentImportStep(JobRepository jobRepository,
                                    PlatformTransactionManager transactionManager,
                                    ItemReader<DocumentImportRow> excelManifestItemReader,
                                    ItemProcessor<DocumentImportRow, ResolvedDocumentImport> documentImportProcessor,
                                    ItemWriter<ResolvedDocumentImport> documentImportWriter,
                                    DocumentImportSkipListener documentImportSkipListener) {
        return new StepBuilder("documentImportStep", jobRepository)
                .<DocumentImportRow, ResolvedDocumentImport>chunk(CHUNK_SIZE, transactionManager)
                .reader(excelManifestItemReader)
                .processor(documentImportProcessor)
                .writer(documentImportWriter)
                .faultTolerant()
                .skip(RowImportException.class)
                .skipLimit(Integer.MAX_VALUE)
                .listener((SkipListener<DocumentImportRow, ResolvedDocumentImport>) documentImportSkipListener)
                .listener((StepExecutionListener) documentImportSkipListener)
                .build();
    }
}
