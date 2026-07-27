package com.skillbridge.platform.users.service.impl;

import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.users.dto.request.*;
import com.skillbridge.platform.users.dto.response.WorkerProfileResponse;
import com.skillbridge.platform.users.entity.*;
import com.skillbridge.platform.users.repository.*;
import com.skillbridge.platform.users.service.WorkerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkerProfileServiceImpl implements WorkerProfileService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerSkillRepository workerSkillRepository;
    private final WorkerExperienceRepository workerExperienceRepository;
    private final WorkerEducationRepository workerEducationRepository;
    private final CertificateRepository certificateRepository;
    private final PortfolioItemRepository portfolioItemRepository;

    @Override
    @Transactional(readOnly = true)
    public WorkerProfileResponse getProfile(UUID userId) {
        return toResponse(getOrCreateProfile(userId));
    }

    @Override
    public WorkerProfileResponse updateProfile(UUID userId, WorkerProfileUpdateRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        profile.setBio(request.bio());
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setGender(request.gender());
        profile.setYearsOfExperience(request.yearsOfExperience());
        profile.setHourlyRate(request.hourlyRate());
        if (request.preferredRadiusKm() != null) {
            profile.setPreferredRadiusKm(request.preferredRadiusKm());
        }
        return toResponse(workerProfileRepository.save(profile));
    }

    @Override
    public WorkerProfileResponse updateLocation(UUID userId, LocationUpdateRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        profile.setCurrentLocation(GeoUtils.toPoint(request.latitude(), request.longitude()));
        return toResponse(workerProfileRepository.save(profile));
    }

    @Override
    public WorkerProfileResponse updateAvailability(UUID userId, AvailabilityUpdateRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        profile.setAvailable(request.available());
        return toResponse(workerProfileRepository.save(profile));
    }

    @Override
    public WorkerSkill addSkill(UUID userId, WorkerSkillRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        WorkerSkill skill = new WorkerSkill();
        skill.setWorkerId(profile.getId());
        skill.setSkillName(request.skillName());
        skill.setProficiencyLevel(request.proficiencyLevel());
        skill.setYearsOfExperience(request.yearsOfExperience());
        return workerSkillRepository.save(skill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkerSkill> getSkills(UUID userId) {
        return workerSkillRepository.findByWorkerId(getOrCreateProfile(userId).getId());
    }

    @Override
    public void deleteSkill(UUID userId, UUID skillId) {
        workerSkillRepository.deleteByIdAndWorkerId(skillId, getOrCreateProfile(userId).getId());
    }

    @Override
    public WorkerExperience addExperience(UUID userId, WorkerExperienceRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        WorkerExperience exp = new WorkerExperience();
        exp.setWorkerId(profile.getId());
        exp.setJobTitle(request.jobTitle());
        exp.setCompanyName(request.companyName());
        exp.setStartDate(request.startDate());
        exp.setEndDate(request.endDate());
        exp.setCurrent(request.current());
        exp.setDescription(request.description());
        return workerExperienceRepository.save(exp);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkerExperience> getExperiences(UUID userId) {
        return workerExperienceRepository.findByWorkerId(getOrCreateProfile(userId).getId());
    }

    @Override
    public WorkerEducation addEducation(UUID userId, WorkerEducationRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        WorkerEducation edu = new WorkerEducation();
        edu.setWorkerId(profile.getId());
        edu.setInstitution(request.institution());
        edu.setDegree(request.degree());
        edu.setFieldOfStudy(request.fieldOfStudy());
        edu.setStartDate(request.startDate());
        edu.setEndDate(request.endDate());
        return workerEducationRepository.save(edu);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkerEducation> getEducation(UUID userId) {
        return workerEducationRepository.findByWorkerId(getOrCreateProfile(userId).getId());
    }

    @Override
    public Certificate addCertificate(UUID userId, CertificateRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        Certificate cert = new Certificate();
        cert.setWorkerId(profile.getId());
        cert.setTitle(request.title());
        cert.setIssuingOrganization(request.issuingOrganization());
        cert.setIssueDate(request.issueDate());
        cert.setExpiryDate(request.expiryDate());
        cert.setCredentialUrl(request.credentialUrl());
        cert.setFileUrl(request.fileUrl());
        return certificateRepository.save(cert);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Certificate> getCertificates(UUID userId) {
        return certificateRepository.findByWorkerId(getOrCreateProfile(userId).getId());
    }

    @Override
    public PortfolioItem addPortfolioItem(UUID userId, PortfolioItemRequest request) {
        WorkerProfile profile = getOrCreateProfile(userId);
        PortfolioItem item = new PortfolioItem();
        item.setWorkerId(profile.getId());
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setMediaUrl(request.mediaUrl());
        item.setProjectUrl(request.projectUrl());
        return portfolioItemRepository.save(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PortfolioItem> getPortfolio(UUID userId) {
        return portfolioItemRepository.findByWorkerId(getOrCreateProfile(userId).getId());
    }

    private WorkerProfile getOrCreateProfile(UUID userId) {
        return workerProfileRepository.findByUserId(userId).orElseGet(() -> {
            WorkerProfile profile = new WorkerProfile();
            profile.setUserId(userId);
            return workerProfileRepository.save(profile);
        });
    }

    private WorkerProfileResponse toResponse(WorkerProfile profile) {
        var user = userRepository.findById(profile.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));
        Double lat = profile.getCurrentLocation() != null ? GeoUtils.getLatitude(profile.getCurrentLocation()) : null;
        Double lng = profile.getCurrentLocation() != null ? GeoUtils.getLongitude(profile.getCurrentLocation()) : null;
        return new WorkerProfileResponse(
                profile.getId(), profile.getUserId(), user.getFullName(), user.getEmail(),
                profile.getBio(), profile.getDateOfBirth(), profile.getGender(), profile.getYearsOfExperience(),
                profile.isAvailable(), profile.getHourlyRate(), profile.getPreferredRadiusKm(),
                lat, lng, profile.getResumeScore(), profile.getAtsScore());
    }
}
