import { COOKIE_NAME, readUserId } from '../lib/auth.js';

// Blocks the request unless it carries a valid login cookie.
// On success, req.userId is set so routes can scope every query to this user.
export function requireAuth(req, res, next) {
  const userId = readUserId(req.cookies?.[COOKIE_NAME]);
  if (!userId) return res.status(401).json({ error: 'Please log in' });
  req.userId = userId;
  next();
}
