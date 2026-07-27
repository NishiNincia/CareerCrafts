package com.skillbridge.platform.resumes.service;

import com.skillbridge.platform.resumes.dto.response.ResumeAnalysisResponse;
import com.skillbridge.platform.resumes.entity.Resume;
import com.skillbridge.platform.resumes.entity.SkillGap;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ResumeService {
    Resume uploadResume(UUID workerUserId, MultipartFile file);
    ResumeAnalysisResponse analyzeResume(UUID workerUserId, UUID resumeId);
    List<Resume> getResumeHistory(UUID workerUserId);
    ResumeAnalysisResponse getLatestAnalysis(UUID workerUserId);
    List<SkillGap> getSkillGaps(UUID workerUserId, UUID jobId);
}
