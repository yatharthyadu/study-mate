import mongoose from 'mongoose';
import { Chunk } from '../models/Chunk.js';
import { config } from './config.js';
import { embedQuery } from './gemini.js';

// Find the top-k chunks most similar to the question across the given PDFs (Atlas Vector Search).
// Filtering by userId guarantees a user can never retrieve another user's text.
export async function findRelevantChunks(userId, documentIds, question, k = 5) {
  const queryVector = await embedQuery(question);

  return Chunk.aggregate([
    {
      $vectorSearch: {
        index: config.vectorIndexName,
        path: 'embedding',
        queryVector,
        numCandidates: k * 20, // consider this many candidates, then pick the best k
        limit: k,
        filter: {
          userId: new mongoose.Types.ObjectId(userId),
          documentId: { $in: documentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
    },
    {
      $project: {
        _id: 0,
        documentId: 1,
        text: 1,
        page: 1,
        score: { $meta: 'vectorSearchScore' }, // how similar it is (0 to 1)
      },
    },
  ]);
}
