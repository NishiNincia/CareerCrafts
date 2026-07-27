package com.skillbridge.platform.payments.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "payments", indexes = @Index(name = "idx_transaction_wallet", columnList = "wallet_id"))
public class Transaction extends BaseEntity {

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Nullable: links a gig-completion payment to the gig it settles. */
    @Column(name = "gig_id")
    private UUID gigId;

    @Column(name = "job_id")
    private UUID jobId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "external_reference")
    private String externalReference; // payment-gateway transaction id

    @Column(columnDefinition = "TEXT")
    private String description;

    public enum TransactionType { CREDIT, DEBIT, REFUND }
    public enum TransactionStatus { PENDING, SUCCESS, FAILED, REVERSED }
}
