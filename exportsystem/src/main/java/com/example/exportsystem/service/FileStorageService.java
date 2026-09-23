package com.example.exportsystem.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Path;

public interface FileStorageService {
    // Saves the file under the configured upload dir and returns the path it was stored at.
    Path store(MultipartFile file, String generatedFileName);

    // Same as above for content that isn't a MultipartFile - e.g. an entry read out of a
    // ZIP during bulk import. Caller owns closing the stream.
    Path store(InputStream in, String generatedFileName);
}
