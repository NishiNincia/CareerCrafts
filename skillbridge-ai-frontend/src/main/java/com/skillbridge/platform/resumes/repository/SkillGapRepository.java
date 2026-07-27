package com.skillbridge.platform.resumes.repository;

import com.skillbridge.platform.resumes.entity.SkillGap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SkillGapRepository extends JpaRepository<SkillGap, UUID> {
    List<SkillGap> findByWorkerId(UUID workerId);
}
