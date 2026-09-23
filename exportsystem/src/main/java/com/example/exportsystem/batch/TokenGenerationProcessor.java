package com.example.exportsystem.batch;

import com.example.exportsystem.entity.Order;
import com.example.exportsystem.repository.OrderRepository;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

// Resolves each manifest row against an existing Order and validates expiryDays. Bad rows
// (unknown order code, non-positive/non-numeric expiryDays) throw RowTokenGenerationException,
// which the step is configured to skip rather than fail the whole job on - see
// TokenGenerationJobConfig.
@Component
@StepScope
public class TokenGenerationProcessor implements ItemProcessor<TokenGenerationRow, ResolvedTokenGeneration> {

    private static final int DEFAULT_EXPIRY_DAYS = 7;

    private final OrderRepository orderRepository;

    public TokenGenerationProcessor(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public ResolvedTokenGeneration process(TokenGenerationRow row) {
        if (row.getOrderCode() == null || row.getOrderCode().isBlank()) {
            throw new RowTokenGenerationException(row.getRowNumber(), row.getOrderCode(), "Missing orderCode");
        }

        Order order = orderRepository.findByOrderCode(row.getOrderCode())
                .orElseThrow(() -> new RowTokenGenerationException(row.getRowNumber(), row.getOrderCode(),
                        "No order found with code " + row.getOrderCode()));

        int expiryDays = DEFAULT_EXPIRY_DAYS;
        if (row.getExpiryDaysRaw() != null && !row.getExpiryDaysRaw().isBlank()) {
            try {
                expiryDays = Integer.parseInt(row.getExpiryDaysRaw().trim());
            } catch (NumberFormatException e) {
                throw new RowTokenGenerationException(row.getRowNumber(), row.getOrderCode(),
                        "Invalid expiryDays: " + row.getExpiryDaysRaw());
            }
            if (expiryDays <= 0) {
                throw new RowTokenGenerationException(row.getRowNumber(), row.getOrderCode(),
                        "expiryDays must be positive: " + row.getExpiryDaysRaw());
            }
        }

        return new ResolvedTokenGeneration(order.getId(), row.getBuyerEmail(), expiryDays, row.getRowNumber(), row.getOrderCode());
    }
}
