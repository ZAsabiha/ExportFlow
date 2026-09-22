package com.example.exportsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// Enables @Async so email notifications (see notification.EmailServiceImpl) are
// sent on a background thread and never block the request that triggered them.
@Configuration
@EnableAsync
public class AsyncConfig {
}
