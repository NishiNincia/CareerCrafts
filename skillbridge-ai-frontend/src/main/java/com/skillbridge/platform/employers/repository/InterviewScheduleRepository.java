package com.skillbridge.platform.employers.repository;

import com.skillbridge.platform.employers.entity.InterviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, UUID> {
    List<InterviewSchedule> findByApplicationId(UUID applicationId);
}
