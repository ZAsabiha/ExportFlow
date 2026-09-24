package com.example.exportsystem.controller;

import com.example.exportsystem.dto.search.SearchResultResponse;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
public class SearchController {

    private final SearchService searchService;
    private final UserRepository userRepository;

    public SearchController(SearchService searchService, UserRepository userRepository) {
        this.searchService = searchService;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/client/search")
    public ResponseEntity<List<SearchResultResponse>> searchClient(Authentication authentication,
                                                                      @RequestParam String q) {
        return ResponseEntity.ok(searchService.searchForClient(currentUser(authentication), q));
    }

    @GetMapping("/api/export-manager/search")
    public ResponseEntity<List<SearchResultResponse>> searchManager(@RequestParam String q) {
        return ResponseEntity.ok(searchService.searchForManager(q));
    }

    @GetMapping("/api/admin/search")
    public ResponseEntity<List<SearchResultResponse>> searchAdmin(@RequestParam String q) {
        return ResponseEntity.ok(searchService.searchForAdmin(q));
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
    }
}
