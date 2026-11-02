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
  const { name, email, password, role = 'worker' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users(name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
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

app.get('/api/v1/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/v1/worker/profile', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('worker.json') });
});

app.get('/api/v1/worker/jobs', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('jobs.json') });
});

app.get('/api/v1/worker/gigs', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('gigs.json') });
});

app.get('/api/v1/worker/courses', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('courses.json') });
});

app.get('/api/v1/worker/schemes', authMiddleware, (req, res) => {
  res.json({ success: true, data: readJson('schemes.json') });
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
