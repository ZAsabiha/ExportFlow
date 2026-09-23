package com.example.exportsystem.service;

import com.example.exportsystem.dto.search.SearchResultResponse;
import com.example.exportsystem.entity.User;

import java.util.List;


public interface SearchService {
    List<SearchResultResponse> searchForClient(User buyer, String query);
    List<SearchResultResponse> searchForManager(String query);
    List<SearchResultResponse> searchForAdmin(String query);
}
