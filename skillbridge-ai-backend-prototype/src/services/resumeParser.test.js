import test from "node:test";
import assert from "node:assert/strict";
import { analyzeResumeText } from "./resumeParser.js";

test("extracts resume sections and classifies an experienced candidate", () => {
    const parsed = analyzeResumeText(`Aarav Sharma
Frontend Engineer
aarav@example.com

Summary
Frontend engineer with 4 years of experience building web applications.

Experience
Frontend Developer at Nova Labs | 2022 - Present
- Built React dashboards used by product teams

Education
B.Tech, IIIT Bangalore | 2018 - 2022

Skills
React, TypeScript, Git

Projects
Hiring Assistant: Built a deployed application for interview workflows.

Certifications
AWS Cloud Practitioner`);

    assert.equal(parsed.name, "Aarav Sharma");
    assert.equal(parsed.title, "Frontend Engineer");
    assert.equal(parsed.email, "aarav@example.com");
    assert.ok(parsed.yearsExperience >= 4);
    assert.equal(parsed.careerLevel, "Intermediate");
    assert.equal(parsed.experience.length, 1);
    assert.equal(parsed.experience[0].company, "Nova Labs");
    assert.deepEqual(parsed.skills, ["React", "TypeScript", "Git"]);
    assert.equal(parsed.education.length, 1);
    assert.equal(parsed.projects.length, 1);
    assert.equal(parsed.certifications[0], "AWS Cloud Practitioner");
    assert.ok(parsed.metrics.atsScore >= 0 && parsed.metrics.atsScore <= 100);
});

test("keeps a short school-project resume at beginner level", () => {
    const parsed = analyzeResumeText(`Mina Patel
Student
Education
BSc Computer Science, Example University, 2025
Skills
Java, HTML
Projects
Library Management System`);

    assert.equal(parsed.careerLevel, "Beginner");
    assert.equal(parsed.yearsExperience, 0);
});

test("promotes a candidate with a senior title or five years of experience", () => {
    const senior = analyzeResumeText(`Alex
Senior Engineer
Summary
Software engineer building internal tools.`);
    const experienced = analyzeResumeText(`Sam
Summary
5 years of experience in software development`);

    assert.equal(senior.careerLevel, "Advanced");
    assert.equal(experienced.careerLevel, "Advanced");
});

test("classifies complex independent projects as intermediate", () => {
    const parsed = analyzeResumeText(`Taylor
Projects
Independent platform: Built and deployed an end-to-end application`);
    assert.equal(parsed.careerLevel, "Intermediate");
});

test("classifies markdown project, certification, competition, and language sections", () => {
    const parsed = analyzeResumeText(`Taylor
### rojects
Cross-Modal Image Generation – Skin Cancer OCT — Python · PyTorch · CycleGAN · OpenCV · NumPy
Engineered a CycleGAN-based model to synthesize OCT-like images.
- Achieved SSIM > 0.75 and PSNR > 28 dB.
CareerCrafts – Job Search & Skill-Building Platform — Django · React.js · PostgreSQL · REST API
Architected a full-stack platform.

CERTIFICATIONS & ACHIEVEMENTS
NPTEL – Introduction to IoT (94%, Elite Gold, Top 1%)
Anthropic – Claude 101

HACKATHONS & COMPETITIONS
HACKSAGON 2026 – Advanced to Ideation Phase
eDC Startup Clinic 4.0 – Selected among top ideas for mentorship

Languages
English (Professional) · Tamil (Native) · Hindi (Professional) Interests`);

    assert.equal(parsed.projects.length, 2);
    assert.equal(parsed.projects[0].name, "Cross-Modal Image Generation – Skin Cancer OCT");
    assert.deepEqual(parsed.projects[0].technologies, ["Python", "PyTorch", "CycleGAN", "OpenCV", "NumPy"]);
    assert.match(parsed.projects[0].description, /SSIM > 0\.75/);
    assert.equal(parsed.projects[1].name, "CareerCrafts – Job Search & Skill-Building Platform");
    assert.deepEqual(parsed.certifications, ["NPTEL – Introduction to IoT (94%, Elite Gold, Top 1%)", "Anthropic – Claude 101"]);
    assert.deepEqual(parsed.achievements, ["94%, Elite Gold, Top 1%"]);
    assert.equal(parsed.competitions.length, 2);
    assert.deepEqual(parsed.languages, ["English (Professional)", "Tamil (Native)", "Hindi (Professional)"]);
    assert.deepEqual(parsed.interests, []);
});

test("keeps projects, experience, skills, and inline languages in their resume sections", () => {
    const parsed = analyzeResumeText(`D Nishi Nincia
PROFILE
Computer Science undergraduate interested in applied AI research.
EDUCATION
B.E. Computer Science | Chennai Institute of Technology
TECHNICAL SKILLS
AI & Machine Learning: Deep Learning, CNNs, CycleGAN, Image Classification
Programming: Python, C++, Java, SQL
RESEARCH & AI/ML PROJECTS
Cross-Modal Skin Imaging: Dermoscopy-to-OCT-Like Synthesis — Python · PyTorch · CycleGAN · OpenCV
· NumPy
• Built an image synthesis pipeline for unpaired imaging data.
Image Classifier Using CNN — Python · TensorFlow · Keras · NumPy
• Trained a CNN with augmentation and evaluated its performance.
CareerCrafts: Job Search & Skill-Building Platform — Express· React.js · PostgreSQL · REST API
• Built a full-stack platform with role-based views.
SecureVitals: IoT Device for Health Monitoring
• Built a wearable prototype with a decision tree and Kalman filter.
EXPERIENCE
Apr 2026 – Jun 2026 | USA (Remote)
Software Testing Intern | Runzo.AI
• Documented bugs and wrote test plans.
Full Stack Developer Intern | Runzo.AI
Nov 2025 – Mar 2026 | USA (Remote)
• Built dashboard components and authentication.
Full Stack Developer Intern | Spryntas Software Solutions
May 2025 – Jun 2025 | Chennai, India
• Delivered a customer feedback application.
IoT Cloud Engineer Intern (Virtual) | EduSkills
Jul 2025 – Sep 2025 | Remote
• Completed AWS training.
CERTIFICATIONS
• NPTEL – Introduction to IoT (94%, Elite Gold, Top 1%)
HACKATHONS & COMPETITIONS
• HACKSAGON 2026 – Advanced to Ideation Phase
Languages: English (Professional) · Tamil (Native) · Hindi (Professional) | Interests: Machine Learning · Computer Vision ·
Generative Models`);

    assert.equal(parsed.projects.length, 4);
    assert.deepEqual(parsed.projects[0].technologies, ["Python", "PyTorch", "CycleGAN", "OpenCV", "NumPy"]);
    assert.equal(parsed.experience.length, 4);
    assert.equal(parsed.experience[0].role, "Software Testing Intern");
    assert.equal(parsed.experience[0].company, "Runzo.AI");
    assert.equal(parsed.experience[0].period, "Apr 2026 – Jun 2026");
    assert.equal(parsed.experience[1].period, "Nov 2025 – Mar 2026");
    assert.equal(parsed.skills.length, 8);
    assert.ok(parsed.skills.includes("Deep Learning"));
    assert.ok(!parsed.skills.some((skill) => skill.startsWith("AI & Machine Learning:")));
    assert.deepEqual(parsed.languages, ["English (Professional)", "Tamil (Native)", "Hindi (Professional)"]);
    assert.deepEqual(parsed.interests, ["Machine Learning", "Computer Vision", "Generative Models"]);
});
