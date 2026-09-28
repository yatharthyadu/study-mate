import mongoose from 'mongoose';
import { Chunk } from '../models/Chunk.js';
import { config } from './config.js';
import { embedQuery } from './gemini.js';

// Find the top-k chunks most similar to the question (Atlas Vector Search)
export async function findRelevantChunks(documentId, question, k = 5) {
  const queryVector = await embedQuery(question);

  return Chunk.aggregate([
    {
      $vectorSearch: {
        index: config.vectorIndexName,
        path: 'embedding',
        queryVector,
        numCandidates: k * 20, // consider this many candidates, then pick the best k
        limit: k,
        filter: { documentId: new mongoose.Types.ObjectId(documentId) },
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        page: 1,
        score: { $meta: 'vectorSearchScore' }, // how similar it is (0 to 1)
      },
    },
  ]);
}
