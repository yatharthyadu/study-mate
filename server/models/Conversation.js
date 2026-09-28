import mongoose from 'mongoose';

export const DEFAULT_TITLE = 'New chat';

// A chat thread. It's tied to the PDFs chosen when it was started.
const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    title: { type: String, default: DEFAULT_TITLE },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
