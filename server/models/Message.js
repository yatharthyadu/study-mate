import mongoose from 'mongoose';

// Where part of an answer came from (shown under the answer in the UI)
const sourceSchema = new mongoose.Schema(
  {
    documentId: mongoose.Schema.Types.ObjectId,
    documentName: String,
    page: Number,
    score: Number,
    preview: String,
  },
  { _id: false }
);

// One question or answer inside a conversation
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    sources: [sourceSchema],
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
