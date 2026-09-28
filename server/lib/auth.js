import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const COOKIE_NAME = 'studymate_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// httpOnly: JavaScript in the browser can't read the token (protects against XSS)
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/',
};

export function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: MAX_AGE_MS / 1000 });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

// Returns the userId stored in the token, or null if it's missing/invalid/expired
export function readUserId(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret).sub;
  } catch {
    return null;
  }
}
