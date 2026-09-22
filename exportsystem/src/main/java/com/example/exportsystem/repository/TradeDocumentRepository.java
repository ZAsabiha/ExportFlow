package com.example.exportsystem.repository;

import com.example.exportsystem.entity.TradeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeDocumentRepository extends JpaRepository<TradeDocument, Long> {
    List<TradeDocument> findByOrder_Id(Long orderId);
}
