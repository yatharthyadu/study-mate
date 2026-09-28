import { Router } from 'express';
import { findRelevantChunks } from '../lib/retriever.js';
import { streamAnswer } from '../lib/gemini.js';
import { Document } from '../models/Document.js';

const router = Router();

// POST /api/chat  body: { documentId, question, history }
// The answer is sent as a text stream (word by word)
router.post('/', async (req, res) => {
  const { documentId, question, history = [] } = req.body;
  if (!documentId || !question?.trim()) {
    return res.status(400).json({ error: 'Both documentId and question are required' });
  }
  if (!(await Document.exists({ _id: documentId }))) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  // Step 1 (Retrieval): find relevant chunks
  const chunks = await findRelevantChunks(documentId, question);

  // Send sources in a header so the UI can show where the answer came from
  const sources = chunks.map((c) => ({ page: c.page, score: Number(c.score.toFixed(3)), preview: c.text.slice(0, 160) }));
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Sources', encodeURIComponent(JSON.stringify(sources)));
  res.setHeader('Access-Control-Expose-Headers', 'X-Sources');

  // Step 2 (Generation): stream the answer from the LLM
  try {
    for await (const text of streamAnswer(question, chunks, history)) {
      res.write(text);
    }
  } catch (err) {
    console.error('LLM error:', err.message);
    res.write('\n\n[Error: something went wrong while generating the answer. Check the server logs.]');
  }
  res.end();
});

export default router;
