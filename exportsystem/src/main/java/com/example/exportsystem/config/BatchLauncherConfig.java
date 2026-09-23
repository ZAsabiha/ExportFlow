package com.example.exportsystem.config;

import org.springframework.batch.core.configuration.JobRegistry;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.launch.support.SimpleJobOperator;
import org.springframework.batch.core.launch.support.TaskExecutorJobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

// Bulk document imports can involve tens of thousands of rows; Spring Boot's default
// JobLauncher runs synchronously, which would block BulkDocumentImportController's HTTP
// thread for the job's entire duration. This launcher runs jobs on a background thread
// instead, so the controller can return as soon as the job starts. JobOperator +
// JobRegistry back the "retry a failed import" endpoint (JobOperator.restart resumes
// from the last completed chunk rather than reprocessing everything).
@Configuration
public class BatchLauncherConfig {

    // Named distinctly from Boot's autoconfigured "jobLauncher" bean (BatchAutoConfiguration)
    // to avoid a bean-definition clash; @Primary makes this the one actually injected
    // wherever a plain JobLauncher is autowired (BulkDocumentImportServiceImpl, the
    // JobLauncherApplicationRunner Boot wires up for the CLI, etc).
    @Bean
    @Primary
    public JobLauncher documentImportJobLauncher(JobRepository jobRepository) throws Exception {
        TaskExecutorJobLauncher launcher = new TaskExecutorJobLauncher();
        launcher.setJobRepository(jobRepository);
        launcher.setTaskExecutor(new SimpleAsyncTaskExecutor("doc-import-"));
        launcher.afterPropertiesSet();
        return launcher;
    }

    // JobRegistry itself comes from Boot's BatchAutoConfiguration, which also auto-registers
    // every Job bean into it (JobRegistrySmartInitializingSingleton) - no extra wiring needed
    // here, just reuse it for the JobOperator below.

    // Named distinctly from Boot's autoconfigured "jobOperator" bean for the same reason
    // as documentImportJobLauncher above.
    @Bean
    @Primary
    public JobOperator documentImportJobOperator(JobLauncher jobLauncher, JobRepository jobRepository,
                                                   JobExplorer jobExplorer, JobRegistry jobRegistry) throws Exception {
        SimpleJobOperator operator = new SimpleJobOperator();
        operator.setJobLauncher(jobLauncher);
        operator.setJobRepository(jobRepository);
        operator.setJobExplorer(jobExplorer);
        operator.setJobRegistry(jobRegistry);
        operator.afterPropertiesSet();
        return operator;
    }
}
