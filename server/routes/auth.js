import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { setAuthCookie, clearAuthCookie } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(body = {}) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  return { email, password };
}

// POST /api/auth/signup  body: { email, password }
router.post('/signup', async (req, res) => {
  const { email, password } = readCredentials(req.body);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' });

  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, SALT_ROUNDS) });
  setAuthCookie(res, user._id);
  res.status(201).json(user.toPublic());
});

// POST /api/auth/login  body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = readCredentials(req.body);
  const user = await User.findOne({ email });
  // Same message for unknown email and wrong password, so emails can't be probed
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  setAuthCookie(res, user._id);
  res.json(user.toPublic());
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me  -> the logged-in user (the client calls this on page load)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Please log in' });
  }
  res.json(user.toPublic());
});

export default router;
