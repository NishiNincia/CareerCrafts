package com.skillbridge.platform.payments.service.impl;

import com.skillbridge.platform.common.exception.ApiException;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.payments.entity.Transaction;
import com.skillbridge.platform.payments.entity.Wallet;
import com.skillbridge.platform.payments.repository.TransactionRepository;
import com.skillbridge.platform.payments.repository.WalletRepository;
import com.skillbridge.platform.payments.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public Wallet getOrCreateWallet(UUID userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet wallet = new Wallet();
            wallet.setUserId(userId);
            return walletRepository.save(wallet);
        });
    }

    @Override
    public Transaction credit(UUID userId, BigDecimal amount, UUID gigId, UUID jobId, String description) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        Transaction txn = buildTransaction(wallet, Transaction.TransactionType.CREDIT, amount, gigId, jobId, description);
        txn.setStatus(Transaction.TransactionStatus.SUCCESS);
        return transactionRepository.save(txn);
    }

    @Override
    public Transaction debit(UUID userId, BigDecimal amount, UUID gigId, UUID jobId, String description) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ApiException(ErrorCode.INSUFFICIENT_BALANCE, "Insufficient wallet balance for this transaction");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Transaction txn = buildTransaction(wallet, Transaction.TransactionType.DEBIT, amount, gigId, jobId, description);
        txn.setStatus(Transaction.TransactionStatus.SUCCESS);
        return transactionRepository.save(txn);
    }

    @Override
    public Transaction refund(UUID userId, UUID originalTransactionId, String reason) {
        Transaction original = transactionRepository.findById(originalTransactionId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Original transaction not found"));

        Wallet wallet = getOrCreateWallet(userId);
        wallet.setBalance(wallet.getBalance().add(original.getAmount()));
        walletRepository.save(wallet);

        Transaction refund = buildTransaction(wallet, Transaction.TransactionType.REFUND, original.getAmount(),
                original.getGigId(), original.getJobId(), "Refund: " + reason);
        refund.setStatus(Transaction.TransactionStatus.SUCCESS);
        return transactionRepository.save(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getHistory(UUID userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
    }

    private Transaction buildTransaction(Wallet wallet, Transaction.TransactionType type, BigDecimal amount,
                                          UUID gigId, UUID jobId, String description) {
        Transaction txn = new Transaction();
        txn.setWalletId(wallet.getId());
        txn.setType(type);
        txn.setAmount(amount);
        txn.setGigId(gigId);
        txn.setJobId(jobId);
        txn.setDescription(description);
        return txn;
    }
}
