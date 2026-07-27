package com.skillbridge.platform.users.dto.request;

import com.skillbridge.platform.users.entity.WorkerSkill.ProficiencyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WorkerSkillRequest(
        @NotBlank String skillName,
        @NotNull ProficiencyLevel proficiencyLevel,
        Integer yearsOfExperience
) {
}
