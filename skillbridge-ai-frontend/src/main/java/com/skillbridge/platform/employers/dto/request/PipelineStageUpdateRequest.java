package com.skillbridge.platform.employers.dto.request;

import com.skillbridge.platform.employers.entity.HiringPipelineStage.Stage;
import jakarta.validation.constraints.NotNull;

public record PipelineStageUpdateRequest(
        @NotNull Stage stage,
        String notes
) {
}
