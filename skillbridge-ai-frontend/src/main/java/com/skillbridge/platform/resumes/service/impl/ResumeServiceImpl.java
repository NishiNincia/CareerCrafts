package com.skillbridge.platform.resumes.service.impl;

import com.skillbridge.platform.ai.contract.AtsScorer;
import com.skillbridge.platform.ai.contract.ResumeParser;
import com.skillbridge.platform.ai.contract.ResumeScorer;
import com.skillbridge.platform.ai.dto.AtsScoreResult;
import com.skillbridge.platform.ai.dto.ParsedResumeResult;
import com.skillbridge.platform.ai.dto.ResumeScoreResult;
import com.skillbridge.platform.common.exception.ApiException;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.common.storage.StorageService;
import com.skillbridge.platform.resumes.dto.response.ResumeAnalysisResponse;
import com.skillbridge.platform.resumes.entity.*;
import com.skillbridge.platform.resumes.repository.*;
import com.skillbridge.platform.resumes.service.ResumeService;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResumeServiceImpl implements ResumeService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain");

    private final ResumeRepository resumeRepository;
    private final ResumeMetadataRepository resumeMetadataRepository;
    private final ResumeScoreRepository resumeScoreRepository;
    private final AtsScoreRepository atsScoreRepository;
    private final SkillGapRepository skillGapRepository;
    private final WorkerProfileRepository workerProfileRepository;

    private final StorageService storageService;
    private final ResumeParser resumeParser;
    private final ResumeScorer resumeScorer;
    private final AtsScorer atsScorer;

    @Override
    public Resume uploadResume(UUID workerUserId, MultipartFile file) {
        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ApiException(ErrorCode.UNSUPPORTED_FILE_TYPE, "Only PDF, DOC, DOCX, and TXT resumes are supported");
        }
        WorkerProfile profile = getWorkerProfile(workerUserId);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(ErrorCode.FILE_UPLOAD_FAILED, "Could not read uploaded file");
        }

        String key = "resumes/" + profile.getId() + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        String url = storageService.upload(bytes, key, file.getContentType());

        // Deactivate previous resumes so "active" always points at the latest upload.
        resumeRepository.findByWorkerIdAndActiveTrue(profile.getId())
                .ifPresent(prev -> { prev.setActive(false); resumeRepository.save(prev); });

        Resume resume = new Resume();
        resume.setWorkerId(profile.getId());
        resume.setFileUrl(url);
        resume.setFileName(file.getOriginalFilename());
        resume.setFileSizeBytes(file.getSize());
        resume.setContentType(file.getContentType());
        resume.setParseStatus("PENDING");
        resume = resumeRepository.save(resume);

        // Parse synchronously against the pluggable ResumeParser contract; a production
        // deployment would instead publish to the resume.parse queue and process async.
        try {
            ParsedResumeResult parsed = resumeParser.parse(bytes, file.getOriginalFilename(), file.getContentType());
            persistParsedData(resume, parsed);
            resume.setParseStatus("PARSED");
        } catch (Exception e) {
            resume.setParseStatus("FAILED");
        }
        return resumeRepository.save(resume);
    }

    @Override
    public ResumeAnalysisResponse analyzeResume(UUID workerUserId, UUID resumeId) {
        WorkerProfile profile = getWorkerProfile(workerUserId);
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESUME_NOT_FOUND, "Resume not found"));
        if (!resume.getWorkerId().equals(profile.getId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "This resume does not belong to you");
        }
        return buildAnalysisResponse(resume);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Resume> getResumeHistory(UUID workerUserId) {
        WorkerProfile profile = getWorkerProfile(workerUserId);
        return resumeRepository.findByWorkerIdOrderByCreatedAtDesc(profile.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeAnalysisResponse getLatestAnalysis(UUID workerUserId) {
        WorkerProfile profile = getWorkerProfile(workerUserId);
        Resume resume = resumeRepository.findByWorkerIdAndActiveTrue(profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESUME_NOT_FOUND, "No active resume found"));
        return buildAnalysisResponse(resume);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SkillGap> getSkillGaps(UUID workerUserId, UUID jobId) {
        WorkerProfile profile = getWorkerProfile(workerUserId);
        return skillGapRepository.findByWorkerId(profile.getId()).stream()
                .filter(gap -> jobId == null || jobId.equals(gap.getJobId()))
                .collect(Collectors.toList());
    }

    private void persistParsedData(Resume resume, ParsedResumeResult parsed) {
        ResumeMetadata metadata = resumeMetadataRepository.findByResumeId(resume.getId()).orElseGet(ResumeMetadata::new);
        metadata.setResumeId(resume.getId());
        metadata.setCandidateName(parsed.candidateName());
        metadata.setEmail(parsed.email());
        metadata.setPhone(parsed.phone());
        metadata.setExtractedSkills(parsed.skills() == null ? null : String.join(",", parsed.skills()));
        metadata.setTotalExperienceYears(parsed.totalExperienceYears());
        metadata.setHighestEducation(parsed.highestEducation());
        metadata.setRawText(parsed.rawText());
        resumeMetadataRepository.save(metadata);

        ResumeScoreResult scoreResult = resumeScorer.score(parsed);
        ResumeScore score = resumeScoreRepository.findByResumeId(resume.getId()).orElseGet(ResumeScore::new);
        score.setResumeId(resume.getId());
        score.setOverallScore(scoreResult.overallScore());
        score.setFormattingScore(scoreResult.formattingScore());
        score.setContentScore(scoreResult.contentScore());
        score.setKeywordScore(scoreResult.keywordScore());
        score.setFeedback(scoreResult.feedback());
        resumeScoreRepository.save(score);

        WorkerProfile profile = workerProfileRepository.findById(resume.getWorkerId()).orElse(null);
        if (profile != null) {
            profile.setResumeScore(scoreResult.overallScore());
            workerProfileRepository.save(profile);
        }
    }

    private ResumeAnalysisResponse buildAnalysisResponse(Resume resume) {
        ResumeMetadata metadata = resumeMetadataRepository.findByResumeId(resume.getId()).orElse(null);
        ResumeScore score = resumeScoreRepository.findByResumeId(resume.getId()).orElse(null);
        List<AtsScore> atsScores = atsScoreRepository.findByResumeId(resume.getId());
        AtsScore latestAts = atsScores.isEmpty() ? null : atsScores.get(atsScores.size() - 1);

        List<String> skills = metadata != null && metadata.getExtractedSkills() != null
                ? Arrays.asList(metadata.getExtractedSkills().split(","))
                : List.of();

        return new ResumeAnalysisResponse(
                resume.getId(),
                resume.getParseStatus(),
                metadata != null ? metadata.getCandidateName() : null,
                metadata != null ? metadata.getEmail() : null,
                metadata != null ? metadata.getPhone() : null,
                skills,
                metadata != null ? metadata.getTotalExperienceYears() : null,
                metadata != null ? metadata.getHighestEducation() : null,
                score != null ? score.getOverallScore() : null,
                score != null ? score.getFeedback() : null,
                latestAts != null ? latestAts.getAtsScore() : null,
                latestAts != null && latestAts.getMissingKeywords() != null
                        ? Arrays.asList(latestAts.getMissingKeywords().split(",")) : List.of()
        );
    }

    private WorkerProfile getWorkerProfile(UUID workerUserId) {
        return workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
    }
}
