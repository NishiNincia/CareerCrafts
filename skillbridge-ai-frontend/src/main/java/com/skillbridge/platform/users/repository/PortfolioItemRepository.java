package com.skillbridge.platform.users.repository;

import com.skillbridge.platform.users.entity.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, UUID> {
    List<PortfolioItem> findByWorkerId(UUID workerId);
}
