package com.skillbridge.platform.learning.entity;

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
@Table(name = "course_bookmarks", indexes = @Index(name = "uq_course_bookmark", columnList = "worker_id, course_id", unique = true))
public class CourseBookmark extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;
}
