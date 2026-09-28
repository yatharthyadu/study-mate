import { Router } from 'express';
import { findRelevantChunks } from '../lib/retriever.js';
import { streamAnswer } from '../lib/gemini.js';
import { generateTitle } from '../lib/studyAids.js';
import { Conversation, DEFAULT_TITLE } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

const router = Router();
const HISTORY_SIZE = 6;

// POST /api/chat  body: { conversationId, question }
// The answer is sent as a text stream (word by word) and saved once it's complete
router.post('/', async (req, res) => {
  const { conversationId, question: rawQuestion } = req.body;
  const question = rawQuestion?.trim();
  if (!conversationId || !question) {
    return res.status(400).json({ error: 'Both conversationId and question are required' });
  }

  const conversation = await Conversation.findOne({ _id: conversationId, userId: req.userId });
  if (!conversation) return res.status(404).json({ error: 'Chat not found' });

  // Previous messages (oldest first) so follow-up questions make sense
  const history = (
    await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(HISTORY_SIZE).select('role content')
  ).reverse();

  // First question: create a title in parallel with the answer
  const titlePromise = history.length === 0 && conversation.title === DEFAULT_TITLE ? generateTitle(question) : null;

  // Step 1 (Retrieval): find relevant chunks
  const chunks = await findRelevantChunks(req.userId, conversation.documentIds[0], question);
  const sources = chunks.map((c) => ({ page: c.page, score: Number(c.score.toFixed(3)), preview: c.text.slice(0, 160) }));

  // Save the question now so it's stored even if the answer fails
  await Message.create({ conversationId, userId: req.userId, role: 'user', content: question });

  // Send sources in a header so the UI can show where the answer came from
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Sources', encodeURIComponent(JSON.stringify(sources)));
  res.setHeader('Access-Control-Expose-Headers', 'X-Sources');

  // Step 2 (Generation): stream the answer from the LLM, keeping a full copy to save
  let answer = '';
  try {
    for await (const text of streamAnswer(question, chunks, history)) {
      answer += text;
      res.write(text);
    }
  } catch (err) {
    console.error('LLM error:', err.message);
    const note = '\n\n[Error: something went wrong while generating the answer. Check the server logs.]';
    answer += note;
    res.write(note);
  }

  // Step 3: save the answer, set the title and bump updatedAt (so the chat moves to the top)
  await Message.create({ conversationId, userId: req.userId, role: 'assistant', content: answer, sources });
  const title = titlePromise ? await titlePromise : conversation.title;
  await Conversation.updateOne({ _id: conversationId }, { $set: { title } });

  res.end();
});

export default router;
