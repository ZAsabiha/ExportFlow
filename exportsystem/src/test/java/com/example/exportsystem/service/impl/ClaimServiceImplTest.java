package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.admin.ResolveClaimRequest;
import com.example.exportsystem.dto.claim.ClaimResponse;
import com.example.exportsystem.entity.ClaimStatus;
import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.entity.OrderStage;
import com.example.exportsystem.entity.RequestStatus;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.NotificationRepository;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.ClaimService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Covers the combined "resolve claim -> government-verify + set deadline" action that's the
// point of the whole Claims feature - see ClaimServiceImpl.resolveClaim.
@SpringBootTest
class ClaimServiceImplTest {

    @Autowired
    private ClaimService claimService;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void resolvingClaimCanVerifyDocumentsAndSetDeadline() {
        User client = uniqueUser("claim-client");
        User admin = uniqueUser("claim-admin");

        Order order = new Order();
        order.setOrderCode("CLAIM-TEST-" + System.nanoTime());
        order.setBuyerName(client.getUsername());
        order.setBuyerEmail(client.getEmail());
        order.setAmount(BigDecimal.TEN);
        order.setRequestStatus(RequestStatus.ACCEPTED);
        order.setStage(OrderStage.APPROVED);
        order = orderRepository.save(order);

        ClaimResponse claim = claimService.fileClaim(client, order.getId(), "Still waiting on this order",
                EnumSet.of(DocumentType.BILL_OF_LADING, DocumentType.CERTIFICATE_OF_ORIGIN), null);
        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.OPEN);
        assertThat(claim.getRequestedDocuments())
                .containsExactlyInAnyOrder(DocumentType.BILL_OF_LADING, DocumentType.CERTIFICATE_OF_ORIGIN);

        ResolveClaimRequest request = new ResolveClaimRequest();
        request.setAdminResponse("Verified with customs, setting a deadline now.");
        request.setMarkGovernmentVerified(true);
        request.setDocumentDeadline(LocalDateTime.now().plusHours(20));
        // Admin narrows the client's list down to the one document that's actually missing.
        request.setRequiredDocuments(EnumSet.of(DocumentType.BILL_OF_LADING));

        ClaimResponse resolved = claimService.resolveClaim(admin, claim.getId(), request);
        assertThat(resolved.getStatus()).isEqualTo(ClaimStatus.RESOLVED);

        Order saved = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(saved.isGovernmentVerified()).isTrue();
        assertThat(saved.getDocumentDeadline()).isNotNull();
        assertThat(saved.isDeadlineReminderSent()).isFalse();
        assertThat(saved.getRequiredDocuments()).containsExactly(DocumentType.BILL_OF_LADING);

        assertThat(notificationRepository.findByRecipientRole("EXPORT_MANAGER", PageRequest.of(0, 50)).getContent())
                .anyMatch(n -> n.getOrderCode().equals(saved.getOrderCode())
                        && n.getMessage().contains("Required documents: Bill of Lading (B/L)."));
    }

    @Test
    void resolvingClaimRejectsDeadlineWhenOrderNotEligible() {
        User client = uniqueUser("claim-client-2");
        User admin = uniqueUser("claim-admin-2");

        Order order = new Order();
        order.setOrderCode("CLAIM-TEST-INELIGIBLE-" + System.nanoTime());
        order.setBuyerName(client.getUsername());
        order.setBuyerEmail(client.getEmail());
        order.setAmount(BigDecimal.ZERO);
        order.setRequestStatus(RequestStatus.PENDING);
        order.setStage(OrderStage.CREATED);
        order = orderRepository.save(order);

        ClaimResponse claim = claimService.fileClaim(client, order.getId(), "Why so slow", null, null);

        ResolveClaimRequest request = new ResolveClaimRequest();
        request.setAdminResponse("Checked in.");
        request.setMarkGovernmentVerified(true);
        request.setDocumentDeadline(LocalDateTime.now().plusHours(10));

        assertThatThrownBy(() -> claimService.resolveClaim(admin, claim.getId(), request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private User uniqueUser(String prefix) {
        User user = new User();
        user.setUsername(prefix);
        user.setEmail(prefix + "-" + System.nanoTime() + "@example.com");
        user.setPassword("test-password-hash");
        return userRepository.save(user);
    }
}
