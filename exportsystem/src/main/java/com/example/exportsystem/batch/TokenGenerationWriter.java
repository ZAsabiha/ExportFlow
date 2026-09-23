package com.example.exportsystem.batch;

import com.example.exportsystem.dto.token.GenerateTokenRequest;
import com.example.exportsystem.service.TokenService;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

// Issues one download token per resolved row via the same TokenService.generateToken path
// a single manual "Generate Token" submission uses (notification + invoice email included),
// so bulk-issued tokens behave identically to one issued by hand.
@Component
public class TokenGenerationWriter implements ItemWriter<ResolvedTokenGeneration> {

    private final TokenService tokenService;

    public TokenGenerationWriter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public void write(Chunk<? extends ResolvedTokenGeneration> chunk) {
        for (ResolvedTokenGeneration item : chunk) {
            writeOne(item);
        }
    }

    private void writeOne(ResolvedTokenGeneration item) {
        GenerateTokenRequest request = new GenerateTokenRequest();
        request.setOrderId(item.getOrderId());
        request.setBuyerEmail(item.getBuyerEmail());
        request.setExpiryDays(item.getExpiryDays());
        try {
            tokenService.generateToken(request);
        } catch (Exception e) {
            throw new RowTokenGenerationException(item.getRowNumber(), item.getOrderCode(),
                    "Failed to generate token: " + e.getMessage());
        }
    }
}
