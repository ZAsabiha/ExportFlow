package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.token.GenerateTokenRequest;
import com.example.exportsystem.dto.token.TokenResponse;
import com.example.exportsystem.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export-manager/tokens")
public class TokenController {

    private final TokenService tokenService;

    public TokenController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @PostMapping
    public ResponseEntity<TokenResponse> generate(@Valid @RequestBody GenerateTokenRequest request) {
        return ResponseEntity.ok(tokenService.generateToken(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<TokenResponse>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.TOKENS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "issuedAt"));
        return ResponseEntity.ok(PageResponse.of(tokenService.listAll(pageable)));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<TokenResponse>> listByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(tokenService.listByOrder(orderId));
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<Void> revoke(@PathVariable String token) {
        tokenService.revoke(token);
        return ResponseEntity.noContent().build();
    }
}
