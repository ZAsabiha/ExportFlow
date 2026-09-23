package com.example.exportsystem.service.impl;

import com.example.exportsystem.config.FileStorageProperties;
import com.example.exportsystem.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path root;

    public FileStorageServiceImpl(FileStorageProperties properties) {
        this.root = Paths.get(properties.getUploadDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not initialize upload directory: " + root, e);
        }
    }

    @Override
    public Path store(MultipartFile file, String generatedFileName) {
        try {
            return store(file.getInputStream(), generatedFileName);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store file " + generatedFileName, e);
        }
    }

    @Override
    public Path store(InputStream in, String generatedFileName) {
        try {
            Path target = root.resolve(generatedFileName).normalize();
            if (!target.getParent().equals(root)) {
                throw new IllegalArgumentException("Invalid file name: " + generatedFileName);
            }
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            return target;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store file " + generatedFileName, e);
        }
    }
}
