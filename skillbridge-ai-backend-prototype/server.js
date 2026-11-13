import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import pool from './src/config/db.js';
import resumeRoutes from './src/routes/resume.js';
import recommendationRoutes from './src/routes/recommendation.js';
import learningRoutes from './src/routes/learning.js';
import { getCompanyEligibility } from './src/services/companyEligibility.js';
import { ensureResumeSchema } from './src/services/resumeSchema.js';
import { startResumeAnalysisWorker } from './src/services/resumeAnalysisWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET is required to start the backend.');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const mockDir = path.join(__dirname, '..', 'skillbridge-ai-frontend', 'mock');

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(mockDir, fileName), 'utf8'));
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'worker',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_size TEXT,
      ADD COLUMN IF NOT EXISTS annual_turnover_cr NUMERIC(12, 2)
  `);
}

await initializeDatabase();
await ensureResumeSchema();
startResumeAnalysisWorker();

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '8h' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'SkillBridge prototype backend is running' });
});

async function handleLogin(req, res) {
  const { email, password } = req.body || {};

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = createToken(user);
    return res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function handleRegister(req, res) {
  const { name, email, password, role = 'worker', companySize, annualTurnoverCr } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }
  if (!['worker', 'employer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Choose a valid account type.' });
  }
  const validCompanySizes = ['micro', 'small', 'medium', 'large'];
  const turnover = annualTurnoverCr;
  if (role === 'employer' && (
    !validCompanySizes.includes(companySize)
    || typeof turnover !== 'number'
    || !Number.isFinite(turnover)
    || turnover < 0
    || turnover > 1_000_000_000
  )) {
    return res.status(400).json({
      success: false,
      message: 'Employer registration requires a company size and valid annual turnover in crore rupees.',
    });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users(name, email, password, role, company_size, annual_turnover_cr)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role, role === 'employer' ? companySize : null, role === 'employer' ? turnover : null]
    );

    const newUser = result.rows[0];
    const token = createToken(newUser);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

app.post('/api/v1/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);
app.post('/api/v1/auth/register', handleRegister);
app.post('/api/auth/register', handleRegister);

app.use('/api/resumes', (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.info(`[Resume API] ${req.method} ${req.path} status=${res.statusCode} durationMs=${Date.now() - startedAt}`);
  });
  next();
});

app.use('/api/resumes', resumeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/learning', learningRoutes);

app.get('/api/v1/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, company_size, annual_turnover_cr FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        companySize: user.company_size,
        annualTurnoverCr: user.annual_turnover_cr === null ? null : Number(user.annual_turnover_cr),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

function requireEmployer(req, res, next) {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ success: false, message: 'This feature is only available to employer accounts.' });
  }
  return next();
}

app.get('/api/v1/employer/company-profile', authMiddleware, requireEmployer, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT company_size, annual_turnover_cr FROM users WHERE id = $1',
      [req.user.id]
    );
    const profile = result.rows[0];
    if (!profile) return res.status(404).json({ success: false, message: 'Employer account not found.' });
    const annualTurnoverCr = profile.annual_turnover_cr === null ? null : Number(profile.annual_turnover_cr);
    const eligibility = getCompanyEligibility(profile.company_size, annualTurnoverCr);
    return res.json({
      success: true,
      data: {
        companySize: profile.company_size,
        annualTurnoverCr,
        ...eligibility,
      },
    });
  } catch (error) {
    console.error('Loading employer company profile failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load company eligibility details.' });
  }
});

app.put('/api/v1/employer/company-profile', authMiddleware, requireEmployer, async (req, res) => {
  const { companySize, annualTurnoverCr } = req.body || {};
  const allowedSizes = new Set(['micro', 'small', 'medium', 'large']);
  const turnover = annualTurnoverCr;
  if (!allowedSizes.has(companySize) || typeof turnover !== 'number' || !Number.isFinite(turnover) || turnover < 0 || turnover > 1_000_000_000) {
    return res.status(400).json({
      success: false,
      message: 'Select a company size and enter a valid annual turnover in crore rupees.',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET company_size = $2, annual_turnover_cr = $3
       WHERE id = $1 AND role = 'employer'
       RETURNING company_size, annual_turnover_cr`,
      [req.user.id, companySize, turnover]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Employer account not found.' });
    const profile = result.rows[0];
    const eligibility = getCompanyEligibility(profile.company_size, Number(profile.annual_turnover_cr));
    return res.json({
      success: true,
      data: {
        companySize: profile.company_size,
        annualTurnoverCr: Number(profile.annual_turnover_cr),
        ...eligibility,
      },
    });
  } catch (error) {
    console.error('Saving employer company profile failed:', error);
    return res.status(500).json({ success: false, message: 'Could not save company eligibility details.' });
  }
});

app.get('/api/v1/employer/schemes', authMiddleware, requireEmployer, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT company_size, annual_turnover_cr FROM users WHERE id = $1',
      [req.user.id]
    );
    const profile = result.rows[0];
    if (!profile) return res.status(404).json({ success: false, message: 'Employer account not found.' });
    const eligibility = getCompanyEligibility(
      profile.company_size,
      profile.annual_turnover_cr === null ? null : Number(profile.annual_turnover_cr)
    );
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        code: 'SMALL_COMPANY_REQUIRED',
        message: 'Government schemes are available only to eligible micro and small companies.',
      });
    }
    return res.json({ success: true, data: readJson('schemes.json') });
  } catch (error) {
    console.error('Loading small-company schemes failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load government schemes.' });
  }
});

app.get('/api/v1/worker/jobs', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('jobs.json') });
});

app.get('/api/v1/worker/gigs', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('gigs.json') });
});

app.get('/api/v1/worker/courses', authMiddleware, async (req, res) => {
  if (req.user.role !== 'worker') {
    return res.status(403).json({ success: false, message: 'Only worker accounts can view courses.' });
  }

  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.provider, c.duration_hours, c.level, c.thumbnail_color, c.match_reason,
              COALESCE(array_agg(DISTINCT cs.skill) FILTER (WHERE cs.skill IS NOT NULL), ARRAY[]::text[]) AS skills
       FROM courses c
       LEFT JOIN course_skills cs ON cs.course_id = c.id
       GROUP BY c.id
       ORDER BY c.level, c.title`
    );
    return res.json({
      success: true,
      data: result.rows.map((course) => ({
        id: course.id,
        title: course.title,
        provider: course.provider,
        durationHours: course.duration_hours,
        level: course.level,
        thumbnailColor: course.thumbnail_color,
        matchReason: course.match_reason,
        skills: course.skills,
      })),
    });
  } catch (error) {
    console.error('Loading courses failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load courses.' });
  }
});

app.get('/api/v1/worker/applications', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('applications.json') });
});

app.get('/api/v1/employer/profile', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('employer.json') });
});

app.get('/api/v1/employer/candidates', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('candidates.json') });
});

app.get('/api/v1/employer/tracked-workers', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('tracked-workers.json') });
});

app.get('/api/v1/employer/reviews', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('reviews.json') });
});

app.get('/api/v1/employer/revenue', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('revenue.json') });
});

app.get('/api/v1/employer/pipeline', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('pipeline.json') });
});

app.get('/api/v1/employer/jobs', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('jobs.json') });
});

app.get('/api/v1/employer/gigs', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('gigs.json') });
});

app.post('/api/v1/worker/gigs/:id/accept', authMiddleware, (req, res) => {
  res.json({ success: true, data: { gigId: req.params.id, status: 'accepted' } });
});

app.post('/api/v1/worker/gigs/:id/decline', authMiddleware, (req, res) => {
  res.json({ success: true, data: { gigId: req.params.id, status: 'declined' } });
});

app.post('/api/v1/employer/jobs', authMiddleware, (req, res) => {
  const job = { id: `j-${Date.now()}`, ...req.body };
  res.status(201).json({ success: true, data: job });
});

app.post('/api/v1/employer/gigs', authMiddleware, (req, res) => {
  const gig = { id: `g-${Date.now()}`, ...req.body };
  res.status(201).json({ success: true, data: gig });
});

function startServer(port) {
  app.listen(port, () => {
    console.log(`SkillBridge prototype backend running on http://localhost:${port}`);
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(error);
      process.exit(1);
    }
  });
}

startServer(DEFAULT_PORT);
