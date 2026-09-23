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

// tokenGenerationJob: the bulk "Excel manifest" download token generation. One step,
// chunked so a large manifest commits incrementally instead of in one giant transaction,
// and fault-tolerant so a bad row (see RowTokenGenerationException) is skipped and
// reported rather than failing the whole job - see TokenGenerationSkipListener. Chunk size
// is smaller than the document import job's since each row also sends an invoice email.
@Configuration
public class TokenGenerationJobConfig {

    private static final int CHUNK_SIZE = 20;

    @Bean
    public Job tokenGenerationJob(JobRepository jobRepository, Step tokenGenerationStep) {
        return new JobBuilder("tokenGenerationJob", jobRepository)
                .start(tokenGenerationStep)
                .build();
    }

    @Bean
    public Step tokenGenerationStep(JobRepository jobRepository,
                                     PlatformTransactionManager transactionManager,
                                     ItemReader<TokenGenerationRow> excelTokenManifestItemReader,
                                     ItemProcessor<TokenGenerationRow, ResolvedTokenGeneration> tokenGenerationProcessor,
                                     ItemWriter<ResolvedTokenGeneration> tokenGenerationWriter,
                                     TokenGenerationSkipListener tokenGenerationSkipListener) {
        return new StepBuilder("tokenGenerationStep", jobRepository)
                .<TokenGenerationRow, ResolvedTokenGeneration>chunk(CHUNK_SIZE, transactionManager)
                .reader(excelTokenManifestItemReader)
                .processor(tokenGenerationProcessor)
                .writer(tokenGenerationWriter)
                .faultTolerant()
                .skip(RowTokenGenerationException.class)
                .skipLimit(Integer.MAX_VALUE)
                .listener((SkipListener<TokenGenerationRow, ResolvedTokenGeneration>) tokenGenerationSkipListener)
                .listener((StepExecutionListener) tokenGenerationSkipListener)
                .build();
    }
}
