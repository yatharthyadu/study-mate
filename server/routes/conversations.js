import { Router } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Document } from '../models/Document.js';

const router = Router();

// GET /api/conversations  -> this user's chats, most recently active first
router.get('/', async (req, res) => {
  const conversations = await Conversation.find({ userId: req.userId })
    .sort({ updatedAt: -1 })
    .select('title documentIds updatedAt');
  res.json(conversations);
});

// POST /api/conversations  body: { documentIds }  -> start a new chat
router.post('/', async (req, res) => {
  const documentIds = [...new Set(req.body.documentIds || [])];
  if (!documentIds.length) return res.status(400).json({ error: 'Select at least one PDF' });

  // Every PDF must belong to this user
  const owned = await Document.countDocuments({ _id: { $in: documentIds }, userId: req.userId });
  if (owned !== documentIds.length) return res.status(404).json({ error: 'PDF not found' });

  const conversation = await Conversation.create({ userId: req.userId, documentIds });
  res.status(201).json(conversation);
});

// GET /api/conversations/:id  -> the chat plus all its messages
router.get('/:id', async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) return res.status(404).json({ error: 'Chat not found' });

  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  res.json({ ...conversation.toObject(), messages });
});

// DELETE /api/conversations/:id  -> delete the chat and its messages
router.delete('/:id', async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!conversation) return res.status(404).json({ error: 'Chat not found' });
  await Message.deleteMany({ conversationId: conversation._id });
  res.json({ ok: true });
});

export default router;
