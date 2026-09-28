import mongoose from 'mongoose';

// Basic info about each uploaded PDF
const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    pages: Number,
    chunkCount: Number,
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
