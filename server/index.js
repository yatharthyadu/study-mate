import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config, checkConfig } from './lib/config.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';

checkConfig();

// No CORS needed: in development Vite proxies /api, so the client and API share one origin
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Public routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);

// Everything below requires a logged-in user
app.use('/api', requireAuth);
app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

// All errors end up here (Express 5 also catches async errors)
app.use((err, req, res, next) => {
  // Malformed ids like /api/documents/abc
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

await mongoose.connect(config.mongoUri);
console.log('MongoDB connected');

app.listen(config.port, () => {
  console.log(`Server running: http://localhost:${config.port}`);
});
