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
import { validateGigPayload } from './src/services/gigValidation.js';
import { ensureResumeSchema } from './src/services/resumeSchema.js';
import { ensureJobListingsSchema } from './src/services/jobListings.js';
import { startResumeAnalysisWorker } from './src/services/resumeAnalysisWorker.js';
import {
  applyToJob,
  closeEmployerJob,
  createEmployerJob,
  getEmployerJobs,
  getNearbyJobs,
  updateEmployerJob,
} from './src/controller/jobs.js';

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gigs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(180) NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      budget NUMERIC(12, 2) NOT NULL CHECK (budget > 0),
      currency CHAR(3) NOT NULL DEFAULT 'INR',
      deadline DATE NOT NULL,
      work_mode TEXT NOT NULL CHECK (work_mode IN ('online', 'on_site')),
      location_address TEXT,
      location_lat DOUBLE PRECISION,
      location_lng DOUBLE PRECISION,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (
        (work_mode = 'online' AND location_address IS NULL AND location_lat IS NULL AND location_lng IS NULL)
        OR
        (work_mode = 'on_site' AND location_address IS NOT NULL AND location_lat IS NOT NULL AND location_lng IS NOT NULL)
      )
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gig_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      proposal TEXT NOT NULL,
      portfolio_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (gig_id, worker_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      gig_id UUID NOT NULL UNIQUE REFERENCES gigs(id) ON DELETE RESTRICT,
      application_id UUID NOT NULL UNIQUE REFERENCES gig_applications(id) ON DELETE RESTRICT,
      client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'changes_requested', 'completed', 'cancelled')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      notes TEXT NOT NULL,
      work_url TEXT,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'changes_requested', 'approved')),
      client_feedback TEXT,
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_location_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN ('travel_started', 'arrived')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (project_id, event_type)
    )
  `);
}

await initializeDatabase();
await ensureJobListingsSchema(pool);
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

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: `This action is only available to ${role} accounts.` });
    }
    return next();
  };
}

function mapGig(row) {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    title: row.title,
    description: row.description,
    requiredSkills: row.required_skills,
    budget: Number(row.budget),
    currency: row.currency,
    deadline: row.deadline,
    workMode: row.work_mode,
    locationAddress: row.location_address,
    geo: row.location_lat == null ? null : { lat: Number(row.location_lat), lng: Number(row.location_lng) },
    status: row.status,
    createdAt: row.created_at,
    applicationId: row.application_id,
    applicationStatus: row.application_status,
  };
}

const GIG_SELECT = `
  SELECT g.*, mine.id AS application_id, mine.status AS application_status, creator.name AS creator_name
  FROM gigs g
  JOIN users creator ON creator.id = g.creator_id
`;

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

app.get('/api/v1/worker/jobs', authMiddleware, requireRole('worker'), getNearbyJobs);
app.post('/api/v1/worker/jobs/:jobId/applications', authMiddleware, requireRole('worker'), applyToJob);

app.get('/api/v1/worker/gigs', authMiddleware, requireRole('worker'), async (req, res) => {
  const search = String(req.query.q || '').trim();
  const skill = String(req.query.skill || '').trim();
  try {
    const result = await pool.query(
      `${GIG_SELECT}
       LEFT JOIN gig_applications mine ON mine.gig_id = g.id AND mine.worker_id = $1
       WHERE g.status = 'open' AND g.deadline >= CURRENT_DATE
         AND ($2 = '' OR g.title ILIKE '%' || $2 || '%' OR g.description ILIKE '%' || $2 || '%' OR creator.name ILIKE '%' || $2 || '%')
         AND ($3 = '' OR EXISTS (SELECT 1 FROM unnest(g.required_skills) AS skill_item(skill) WHERE skill_item.skill ILIKE $3))
       ORDER BY g.created_at DESC
       LIMIT 100`,
      [req.user.id, search, skill ? `%${skill}%` : '']
    );
    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...mapGig(row),
        locationAddress: null,
        geo: null,
        applicationId: row.application_id,
        applicationStatus: row.application_status,
      })),
    });
  } catch (error) {
    console.error('Loading available gigs failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load available gigs.' });
  }
});

app.post('/api/v1/worker/gigs/:id/applications', authMiddleware, requireRole('worker'), async (req, res) => {
  const { proposal, portfolioUrl } = req.body || {};
  const trimmedProposal = typeof proposal === 'string' ? proposal.trim() : '';
  const trimmedPortfolio = typeof portfolioUrl === 'string' ? portfolioUrl.trim() : '';
  if (trimmedProposal.length < 20 || trimmedProposal.length > 5000) {
    return res.status(400).json({ success: false, message: 'Proposal must be between 20 and 5,000 characters.' });
  }
  if (trimmedPortfolio && (!/^https?:\/\/\S+$/i.test(trimmedPortfolio) || trimmedPortfolio.length > 2048)) {
    return res.status(400).json({ success: false, message: 'Enter a valid portfolio URL.' });
  }
  try {
    const gigResult = await pool.query(
      "SELECT id FROM gigs WHERE id = $1 AND status = 'open' AND deadline >= CURRENT_DATE",
      [req.params.id]
    );
    if (!gigResult.rows.length) return res.status(404).json({ success: false, message: 'This gig is no longer available.' });
    const result = await pool.query(
      `INSERT INTO gig_applications (gig_id, worker_id, proposal, portfolio_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (gig_id, worker_id) DO NOTHING
       RETURNING id, gig_id, worker_id, proposal, portfolio_url, status, submitted_at`,
      [req.params.id, req.user.id, trimmedProposal, trimmedPortfolio || null]
    );
    if (!result.rows.length) return res.status(409).json({ success: false, message: 'You have already applied to this gig.' });
    const application = result.rows[0];
    return res.status(201).json({
      success: true,
      data: {
        id: application.id,
        gigId: application.gig_id,
        workerId: application.worker_id,
        proposal: application.proposal,
        portfolioUrl: application.portfolio_url,
        status: application.status,
        submittedAt: application.submitted_at,
      },
    });
  } catch (error) {
    console.error('Submitting gig application failed:', error);
    return res.status(500).json({ success: false, message: 'Could not submit your proposal.' });
  }
});

app.get('/api/v1/worker/gig-applications', authMiddleware, requireRole('worker'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.gig_id, a.proposal, a.portfolio_url, a.status, a.submitted_at,
              g.title, g.budget, g.currency, g.work_mode, g.status AS gig_status
       FROM gig_applications a JOIN gigs g ON g.id = a.gig_id
       WHERE a.worker_id = $1 ORDER BY a.submitted_at DESC`,
      [req.user.id]
    );
    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        gigId: row.gig_id,
        title: row.title,
        proposal: row.proposal,
        portfolioUrl: row.portfolio_url,
        budget: Number(row.budget),
        currency: row.currency,
        workMode: row.work_mode,
        gigStatus: row.gig_status,
        status: row.status,
        submittedAt: row.submitted_at,
      })),
    });
  } catch (error) {
    console.error('Loading worker gig applications failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load your gig applications.' });
  }
});

const PROJECT_SELECT = `
  SELECT p.id, p.status, p.created_at, p.completed_at,
         g.id AS gig_id, g.title, g.description, g.required_skills, g.budget, g.currency,
         g.deadline, g.work_mode, g.location_address, g.location_lat, g.location_lng,
         client.name AS client_name, worker.name AS worker_name,
         latest.id AS submission_id, latest.notes AS submission_notes, latest.work_url,
         latest.status AS submission_status, latest.client_feedback, latest.submitted_at,
         COALESCE(events.items, '[]'::json) AS location_events
  FROM projects p
  JOIN gigs g ON g.id = p.gig_id
  JOIN users client ON client.id = p.client_id
  JOIN users worker ON worker.id = p.worker_id
  LEFT JOIN LATERAL (
    SELECT s.* FROM project_submissions s
    WHERE s.project_id = p.id ORDER BY s.submitted_at DESC LIMIT 1
  ) latest ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('type', e.event_type, 'createdAt', e.created_at) ORDER BY e.created_at) AS items
    FROM project_location_events e WHERE e.project_id = p.id
  ) events ON TRUE
`;

function mapProject(row) {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    gig: {
      id: row.gig_id,
      title: row.title,
      description: row.description,
      requiredSkills: row.required_skills,
      budget: Number(row.budget),
      currency: row.currency,
      deadline: row.deadline,
      workMode: row.work_mode,
      locationAddress: row.location_address,
      geo: row.location_lat == null ? null : { lat: Number(row.location_lat), lng: Number(row.location_lng) },
    },
    clientName: row.client_name,
    workerName: row.worker_name,
    latestSubmission: row.submission_id ? {
      id: row.submission_id,
      notes: row.submission_notes,
      workUrl: row.work_url,
      status: row.submission_status,
      clientFeedback: row.client_feedback,
      submittedAt: row.submitted_at,
    } : null,
    locationEvents: row.location_events,
  };
}

app.get('/api/v1/worker/projects', authMiddleware, requireRole('worker'), async (req, res) => {
  try {
    const result = await pool.query(`${PROJECT_SELECT} WHERE p.worker_id = $1 ORDER BY p.created_at DESC`, [req.user.id]);
    return res.json({ success: true, data: result.rows.map(mapProject) });
  } catch (error) {
    console.error('Loading worker projects failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load your projects.' });
  }
});

app.post('/api/v1/worker/projects/:projectId/submissions', authMiddleware, requireRole('worker'), async (req, res) => {
  const { notes, workUrl } = req.body || {};
  const deliveryNotes = typeof notes === 'string' ? notes.trim() : '';
  const deliveryUrl = typeof workUrl === 'string' ? workUrl.trim() : '';
  if (deliveryNotes.length < 10 || deliveryNotes.length > 5000) {
    return res.status(400).json({ success: false, message: 'Delivery notes must be between 10 and 5,000 characters.' });
  }
  if (deliveryUrl && (!/^https?:\/\/\S+$/i.test(deliveryUrl) || deliveryUrl.length > 2048)) {
    return res.status(400).json({ success: false, message: 'Enter a valid work submission URL.' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const projectResult = await client.query(
      `SELECT p.status, g.work_mode,
              EXISTS (SELECT 1 FROM project_location_events e WHERE e.project_id = p.id AND e.event_type = 'arrived') AS arrived
       FROM projects p JOIN gigs g ON g.id = p.gig_id
       WHERE p.id = $1 AND p.worker_id = $2 FOR UPDATE`,
      [req.params.projectId, req.user.id]
    );
    const project = projectResult.rows[0];
    if (!project) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!['active', 'changes_requested'].includes(project.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This project is not accepting a submission.' });
    }
    if (project.work_mode === 'on_site' && !project.arrived) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Confirm arrival at the work location before submitting.' });
    }
    const submissionResult = await client.query(
      `INSERT INTO project_submissions (project_id, notes, work_url)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, notes, work_url, status, submitted_at`,
      [req.params.projectId, deliveryNotes, deliveryUrl || null]
    );
    await client.query("UPDATE projects SET status = 'submitted' WHERE id = $1", [req.params.projectId]);
    await client.query('COMMIT');
    const submission = submissionResult.rows[0];
    return res.status(201).json({
      success: true,
      data: {
        id: submission.id,
        projectId: submission.project_id,
        notes: submission.notes,
        workUrl: submission.work_url,
        status: submission.status,
        submittedAt: submission.submitted_at,
      },
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Submitting project delivery failed:', error);
    return res.status(500).json({ success: false, message: 'Could not submit completed work.' });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/v1/worker/projects/:projectId/location-events', authMiddleware, requireRole('worker'), async (req, res) => {
  const { eventType } = req.body || {};
  if (!['travel_started', 'arrived'].includes(eventType)) {
    return res.status(400).json({ success: false, message: 'Choose a valid on-site travel event.' });
  }
  try {
    const projectResult = await pool.query(
      `SELECT p.status, EXISTS (SELECT 1 FROM gigs g WHERE g.id = p.gig_id AND g.work_mode = 'on_site') AS is_on_site
       FROM projects p WHERE p.id = $1 AND p.worker_id = $2`,
      [req.params.projectId, req.user.id]
    );
    const project = projectResult.rows[0];
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (!project.is_on_site) return res.status(400).json({ success: false, message: 'Travel updates are only available for on-site projects.' });
    if (project.status !== 'active') return res.status(409).json({ success: false, message: 'Travel updates are closed for this project.' });
    if (eventType === 'arrived') {
      const travelResult = await pool.query(
        "SELECT id FROM project_location_events WHERE project_id = $1 AND worker_id = $2 AND event_type = 'travel_started'",
        [req.params.projectId, req.user.id]
      );
      if (!travelResult.rows.length) return res.status(409).json({ success: false, message: 'Mark travel started before confirming arrival.' });
    }
    const result = await pool.query(
      `INSERT INTO project_location_events (project_id, worker_id, event_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, event_type) DO NOTHING
       RETURNING id, event_type, created_at`,
      [req.params.projectId, req.user.id, eventType]
    );
    if (!result.rows.length) return res.status(409).json({ success: false, message: 'This travel event was already recorded.' });
    return res.status(201).json({ success: true, data: { id: result.rows[0].id, type: result.rows[0].event_type, createdAt: result.rows[0].created_at } });
  } catch (error) {
    console.error('Recording on-site project event failed:', error);
    return res.status(500).json({ success: false, message: 'Could not save this travel update.' });
  }
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

app.get('/api/v1/worker/applications', authMiddleware, requireRole('worker'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT application.id, job.id AS job_id, job.title AS job_title, employer.name AS company,
              application.status, application.created_at AS applied_at
       FROM marketplace_job_applications application
       JOIN marketplace_jobs job ON job.id = application.job_id
       JOIN users employer ON employer.id = job.employer_user_id
       WHERE application.worker_id = $1
       UNION ALL
       SELECT application.id, gig.id AS job_id, gig.title AS job_title, employer.name AS company,
              CASE application.status
                WHEN 'accepted' THEN 'hired'
                WHEN 'rejected' THEN 'rejected'
                ELSE 'applied'
              END AS status,
              application.submitted_at AS applied_at
       FROM gig_applications application
       JOIN gigs gig ON gig.id = application.gig_id
       JOIN users employer ON employer.id = gig.creator_id
       WHERE application.worker_id = $1 AND application.status <> 'withdrawn'
       ORDER BY applied_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return res.json({
      success: true,
      data: result.rows.map((application) => ({
        id: application.id,
        jobId: application.job_id,
        jobTitle: application.job_title,
        company: application.company,
        status: application.status,
        appliedAt: application.applied_at,
      })),
    });
  } catch (error) {
    console.error('Loading worker applications failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load your applications.' });
  }
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

app.get('/api/v1/employer/jobs', authMiddleware, requireEmployer, getEmployerJobs);
app.put('/api/v1/employer/jobs/:jobId', authMiddleware, requireEmployer, updateEmployerJob);
app.delete('/api/v1/employer/jobs/:jobId', authMiddleware, requireEmployer, closeEmployerJob);

app.get('/api/v1/employer/gigs', authMiddleware, requireRole('employer'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, creator.name AS creator_name,
              COUNT(a.id)::int AS application_count
       FROM gigs g
       JOIN users creator ON creator.id = g.creator_id
       LEFT JOIN gig_applications a ON a.gig_id = g.id
       WHERE g.creator_id = $1
       GROUP BY g.id, creator.name
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    return res.json({
      success: true,
      data: result.rows.map((row) => ({ ...mapGig(row), applicationCount: row.application_count })),
    });
  } catch (error) {
    console.error('Loading employer gigs failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load your gigs.' });
  }
});

app.get('/api/v1/employer/gigs/:gigId/applications', authMiddleware, requireRole('employer'), async (req, res) => {
  try {
    const gigResult = await pool.query(
      'SELECT id FROM gigs WHERE id = $1 AND creator_id = $2',
      [req.params.gigId, req.user.id]
    );
    if (!gigResult.rows.length) return res.status(404).json({ success: false, message: 'Gig not found.' });
    const result = await pool.query(
      `SELECT a.id, a.gig_id, a.worker_id, a.proposal, a.portfolio_url, a.status, a.submitted_at,
              u.name AS worker_name, u.email AS worker_email
       FROM gig_applications a JOIN users u ON u.id = a.worker_id
       WHERE a.gig_id = $1 ORDER BY a.submitted_at`,
      [req.params.gigId]
    );
    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        gigId: row.gig_id,
        workerId: row.worker_id,
        workerName: row.worker_name,
        workerEmail: row.worker_email,
        proposal: row.proposal,
        portfolioUrl: row.portfolio_url,
        status: row.status,
        submittedAt: row.submitted_at,
      })),
    });
  } catch (error) {
    console.error('Loading gig applications failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load gig applications.' });
  }
});

app.patch('/api/v1/employer/gig-applications/:applicationId', authMiddleware, requireRole('employer'), async (req, res) => {
  const { decision } = req.body || {};
  if (!['accepted', 'rejected'].includes(decision)) {
    return res.status(400).json({ success: false, message: 'Decision must be accepted or rejected.' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const applicationResult = await client.query(
      `SELECT a.id, a.gig_id, a.status AS application_status, g.status AS gig_status,
              g.deadline >= CURRENT_DATE AS is_before_deadline
       FROM gig_applications a JOIN gigs g ON g.id = a.gig_id
       WHERE a.id = $1 AND g.creator_id = $2
       FOR UPDATE OF a, g`,
      [req.params.applicationId, req.user.id]
    );
    const application = applicationResult.rows[0];
    if (!application) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    if (application.application_status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This application has already been decided.' });
    }
    if (decision === 'accepted' && (application.gig_status !== 'open' || !application.is_before_deadline)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This gig is no longer accepting applications.' });
    }
    const updated = await client.query(
      `UPDATE gig_applications SET status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING id, status`,
      [application.id, decision]
    );
    if (decision === 'accepted') {
      await client.query(
        `INSERT INTO projects (gig_id, application_id, client_id, worker_id)
         SELECT a.gig_id, a.id, g.creator_id, a.worker_id
         FROM gig_applications a JOIN gigs g ON g.id = a.gig_id WHERE a.id = $1`,
        [application.id]
      );
      await client.query(
        `UPDATE gigs SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [application.gig_id]
      );
      await client.query(
        `UPDATE gig_applications SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE gig_id = $1 AND id <> $2 AND status = 'pending'`,
        [application.gig_id, application.id]
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Deciding gig application failed:', error);
    return res.status(500).json({ success: false, message: 'Could not update the application.' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/v1/employer/projects', authMiddleware, requireRole('employer'), async (req, res) => {
  try {
    const result = await pool.query(`${PROJECT_SELECT} WHERE p.client_id = $1 ORDER BY p.created_at DESC`, [req.user.id]);
    return res.json({ success: true, data: result.rows.map(mapProject) });
  } catch (error) {
    console.error('Loading employer projects failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load your projects.' });
  }
});

app.patch('/api/v1/employer/projects/:projectId/submissions/:submissionId', authMiddleware, requireRole('employer'), async (req, res) => {
  const { decision, feedback } = req.body || {};
  const review = typeof feedback === 'string' ? feedback.trim() : '';
  if (!['approved', 'changes_requested'].includes(decision)) {
    return res.status(400).json({ success: false, message: 'Decision must be approved or request changes.' });
  }
  if (decision === 'changes_requested' && review.length < 5) {
    return res.status(400).json({ success: false, message: 'Provide feedback explaining the requested changes.' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const submissionResult = await client.query(
      `SELECT s.id, s.project_id, s.status, p.gig_id
       FROM project_submissions s JOIN projects p ON p.id = s.project_id
       WHERE s.id = $1 AND s.project_id = $2 AND p.client_id = $3
       FOR UPDATE OF s, p`,
      [req.params.submissionId, req.params.projectId, req.user.id]
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    if (submission.status !== 'submitted') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This submission has already been reviewed.' });
    }
    await client.query(
      `UPDATE project_submissions SET status = $2, client_feedback = $3, reviewed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [submission.id, decision, review || null]
    );
    await client.query(
      `UPDATE projects SET status = $2, completed_at = CASE WHEN $2 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $1`,
      [submission.project_id, decision === 'approved' ? 'completed' : 'changes_requested']
    );
    if (decision === 'approved') {
      await client.query("UPDATE gigs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [submission.gig_id]);
    }
    await client.query('COMMIT');
    return res.json({ success: true, data: { projectId: submission.project_id, status: decision === 'approved' ? 'completed' : 'changes_requested' } });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Reviewing project submission failed:', error);
    return res.status(500).json({ success: false, message: 'Could not save submission review.' });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/v1/employer/jobs', authMiddleware, requireEmployer, createEmployerJob);

app.post('/api/v1/employer/gigs', authMiddleware, requireRole('employer'), async (req, res) => {
  const validation = validateGigPayload(req.body);
  if (validation.error) return res.status(400).json({ success: false, message: validation.error });
  const gig = validation.value;
  try {
    const result = await pool.query(
      `INSERT INTO gigs (
         creator_id, title, description, required_skills, budget, deadline,
         work_mode, location_address, location_lat, location_lng
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id, gig.title, gig.description, gig.requiredSkills, gig.budget,
        gig.deadline, gig.workMode, gig.locationAddress, gig.locationLat, gig.locationLng,
      ]
    );
    return res.status(201).json({ success: true, data: mapGig({ ...result.rows[0], creator_name: '' }) });
  } catch (error) {
    console.error('Creating gig failed:', error);
    return res.status(500).json({ success: false, message: 'Could not create this gig.' });
  }
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
