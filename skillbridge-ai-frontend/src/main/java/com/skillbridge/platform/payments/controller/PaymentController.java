package com.skillbridge.platform.payments.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.payments.entity.Transaction;
import com.skillbridge.platform.payments.entity.Wallet;
import com.skillbridge.platform.payments.service.PaymentService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Wallet balance, gig payments, refunds, and transaction history")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/wallet")
    public ApiResponse<Wallet> getWallet() {
        return ApiResponse.success(paymentService.getOrCreateWallet(CurrentUserId.get()));
    }

    @GetMapping("/history")
    public ApiResponse<List<Transaction>> history() {
        return ApiResponse.success(paymentService.getHistory(CurrentUserId.get()));
    }

    @PostMapping("/refund/{transactionId}")
    public ApiResponse<Transaction> refund(@PathVariable UUID transactionId, @RequestParam(required = false) String reason) {
        return ApiResponse.success("Refund processed",
                paymentService.refund(CurrentUserId.get(), transactionId, reason == null ? "Requested by user" : reason));
    }
}
