package com.example.exportsystem.service;

import com.example.exportsystem.dto.search.SearchResultResponse;
import com.example.exportsystem.entity.User;

import java.util.List;

// Backs the search box in TopNavbar, present on every portal. Each method is scoped to
// what that portal is allowed to see - see SearchServiceImpl.
public interface SearchService {
    List<SearchResultResponse> searchForClient(User buyer, String query);
    List<SearchResultResponse> searchForManager(String query);
    List<SearchResultResponse> searchForAdmin(String query);
}
