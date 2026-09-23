package com.example.exportsystem.repository;

import com.example.exportsystem.entity.DownloadToken;
import com.example.exportsystem.entity.DownloadTokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DownloadTokenRepository extends JpaRepository<DownloadToken, Long> {
    Optional<DownloadToken> findByToken(String token);
    List<DownloadToken> findByOrder_Id(Long orderId);
    List<DownloadToken> findByOrder_IdIn(List<Long> orderIds);
    long countByStatus(DownloadTokenStatus status);
}
