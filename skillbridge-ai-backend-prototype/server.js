import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'skillbridge-prototype-secret';

app.use(cors());
app.use(express.json());

const mockDir = path.join(__dirname, '..', 'skillbridge-ai-frontend', 'mock');

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(mockDir, fileName), 'utf8'));
}

const users = [
  {
    id: 'u-1',
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    password: 'password123',
    role: 'worker',
  },
  {
    id: 'u-2',
    name: 'Mina Chen',
    email: 'mina@example.com',
    password: 'password123',
    role: 'employer',
  },
];

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

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((entry) => entry.email === email && entry.password === password);

  if (!user) {
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
});

app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, role = 'worker' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const existing = users.find((entry) => entry.email === email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  const newUser = { id: `u-${Date.now()}`, name, email, password, role };
  users.push(newUser);

  const token = createToken(newUser);
  return res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      token,
    },
  });
});

app.get('/api/v1/me', authMiddleware, (req, res) => {
  const user = users.find((entry) => entry.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
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

app.listen(PORT, () => {
  console.log(`SkillBridge prototype backend running on http://localhost:${PORT}`);
});
