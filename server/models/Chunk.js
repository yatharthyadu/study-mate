import mongoose from 'mongoose';

// A piece of a PDF + its embedding (vector)
const chunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
  text: { type: String, required: true },
  page: Number,
  embedding: { type: [Number], required: true },
});

export const Chunk = mongoose.model('Chunk', chunkSchema);
