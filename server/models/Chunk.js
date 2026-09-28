import mongoose from 'mongoose';

// A piece of a PDF + its embedding (vector).
// userId is stored here too so vector search can filter by owner directly.
const chunkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
  text: { type: String, required: true },
  page: Number,
  embedding: { type: [Number], required: true },
});

export const Chunk = mongoose.model('Chunk', chunkSchema);
