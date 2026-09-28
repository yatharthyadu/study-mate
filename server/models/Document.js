import mongoose from 'mongoose';

// Basic info about each uploaded PDF
const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pages: Number,
    chunkCount: Number,
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
