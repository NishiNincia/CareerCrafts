-- Small seed dataset so the recommendation/learning/scheme endpoints have
-- something to return out of the box in a fresh dev environment.

INSERT INTO courses (title, description, primary_skill, provider_name, external_url, duration_hours, level, free)
VALUES
    ('Intro to Plumbing Basics', 'Foundational plumbing skills for hyperlocal service work.', 'plumbing', 'SkillBridge Learning', 'https://example.com/courses/plumbing-basics', 8, 'BEGINNER', true),
    ('Electrical Wiring Safety', 'Safe residential wiring practices and certification prep.', 'electrical', 'SkillBridge Learning', 'https://example.com/courses/electrical-safety', 12, 'INTERMEDIATE', true),
    ('Professional Housekeeping', 'Efficient, professional-grade housekeeping techniques.', 'housekeeping', 'SkillBridge Learning', 'https://example.com/courses/housekeeping', 6, 'BEGINNER', true),
    ('Delivery & Logistics Essentials', 'Route planning, customer service, and safety for delivery work.', 'delivery', 'SkillBridge Learning', 'https://example.com/courses/delivery-essentials', 4, 'BEGINNER', true),
    ('Advanced Carpentry Techniques', 'Furniture-grade joinery and finishing techniques.', 'carpentry', 'SkillBridge Learning', 'https://example.com/courses/carpentry-advanced', 20, 'ADVANCED', false);

INSERT INTO government_schemes (title, description, category, issuing_body, eligibility_criteria, benefit_summary, official_url)
VALUES
    ('PM Vishwakarma Scheme', 'Support scheme for traditional artisans and craftspeople, including skill training and toolkit incentives.', 'SKILL_DEVELOPMENT', 'Ministry of MSME', 'min_age:18,max_age:60', 'Skill training, toolkit incentive, and collateral-free credit support.', 'https://pmvishwakarma.gov.in'),
    ('PMKVY (Pradhan Mantri Kaushal Vikas Yojana)', 'Free short-term skill training and certification for youth.', 'SKILL_DEVELOPMENT', 'Ministry of Skill Development', 'min_age:18,max_age:45', 'Free training, certification, and placement assistance.', 'https://pmkvyofficial.org'),
    ('National Pension Scheme for Traders', 'Voluntary pension scheme for small traders and self-employed workers.', 'FINANCIAL_AID', 'Ministry of Labour and Employment', 'min_age:18,max_age:40', 'Monthly pension of INR 3000 after age 60.', 'https://maandhan.in');
