import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config, checkConfig } from './lib/config.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';

checkConfig();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

// All errors end up here (Express 5 also catches async errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

await mongoose.connect(config.mongoUri);
console.log('MongoDB connected');

app.listen(config.port, () => {
  console.log(`Server running: http://localhost:${config.port}`);
});
