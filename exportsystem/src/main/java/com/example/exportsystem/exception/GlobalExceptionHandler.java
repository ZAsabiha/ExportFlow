package com.example.exportsystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns service-layer RuntimeExceptions (bad credentials, duplicate email, expired refresh
 * token, etc.) into a small, consistent JSON error body instead of a raw 500 stack trace.
 * This is what lets the frontend show a real error message to the user.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        HttpStatus status = resolveStatus(ex.getMessage());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Something went wrong");

        return ResponseEntity.status(status).body(body);
    }

    private HttpStatus resolveStatus(String message) {
        if (message == null) {
            return HttpStatus.BAD_REQUEST;
        }
        String lower = message.toLowerCase();
        if (lower.contains("invalid email or password")) {
            return HttpStatus.UNAUTHORIZED;
        }
        if (lower.contains("not found")) {
            return HttpStatus.NOT_FOUND;
        }
        if (lower.contains("already registered") || lower.contains("expired")) {
            return HttpStatus.CONFLICT;
        }
        if (lower.contains("deactivated")) {
            return HttpStatus.FORBIDDEN;
        }
        return HttpStatus.BAD_REQUEST;
    }
}
