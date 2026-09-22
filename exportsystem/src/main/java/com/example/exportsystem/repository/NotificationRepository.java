package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Paginated variants backing the client/manager notification inbox pages.
    Page<Notification> findByRecipientEmailIgnoreCase(String recipientEmail, Pageable pageable);

    Page<Notification> findByRecipientRole(String recipientRole, Pageable pageable);
}
