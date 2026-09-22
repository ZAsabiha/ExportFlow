package com.example.exportsystem.service;

import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

public interface FileStorageService {
    // Saves the file under the configured upload dir and returns the path it was stored at.
    Path store(MultipartFile file, String generatedFileName);
}
