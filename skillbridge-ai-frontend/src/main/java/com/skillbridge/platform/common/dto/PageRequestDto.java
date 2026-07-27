package com.skillbridge.platform.common.dto;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Standard pagination + sorting request parameters shared by all listing endpoints.
 */
public record PageRequestDto(
        Integer page,
        Integer size,
        String sortBy,
        String direction
) {
    public Pageable toPageable() {
        int p = page == null || page < 0 ? 0 : page;
        int s = size == null || size <= 0 ? 20 : Math.min(size, 100);
        String sortField = sortBy == null || sortBy.isBlank() ? "createdAt" : sortBy;
        Sort.Direction dir = direction != null && direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(p, s, Sort.by(dir, sortField));
    }
}
