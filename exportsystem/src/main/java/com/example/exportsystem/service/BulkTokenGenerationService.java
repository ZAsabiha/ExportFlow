package com.example.exportsystem.service;

import com.example.exportsystem.dto.token.BulkTokenGenerationStatusResponse;
import com.example.exportsystem.dto.token.TokenGenerationErrorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface BulkTokenGenerationService {


    BulkTokenGenerationStatusResponse launchGeneration(MultipartFile manifest);

    BulkTokenGenerationStatusResponse getStatus(Long jobExecutionId);

    Page<TokenGenerationErrorResponse> getErrors(Long jobExecutionId, Pageable pageable);

    BulkTokenGenerationStatusResponse retry(Long jobExecutionId);
}
