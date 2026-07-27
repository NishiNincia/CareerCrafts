package com.skillbridge.platform.payments.service;

import com.skillbridge.platform.payments.entity.Transaction;
import com.skillbridge.platform.payments.entity.Wallet;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PaymentService {
    Wallet getOrCreateWallet(UUID userId);
    Transaction credit(UUID userId, BigDecimal amount, UUID gigId, UUID jobId, String description);
    Transaction debit(UUID userId, BigDecimal amount, UUID gigId, UUID jobId, String description);
    Transaction refund(UUID userId, UUID originalTransactionId, String reason);
    List<Transaction> getHistory(UUID userId);
}
