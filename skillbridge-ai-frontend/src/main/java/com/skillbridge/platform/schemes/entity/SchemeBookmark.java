package com.skillbridge.platform.schemes.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "scheme_bookmarks", indexes = @Index(name = "uq_scheme_bookmark", columnList = "worker_id, scheme_id", unique = true))
public class SchemeBookmark extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "scheme_id", nullable = false)
    private UUID schemeId;
}
