// Run once: npm run create-index
// Creates a vector search index on the "chunks" collection in MongoDB Atlas.

import mongoose from 'mongoose';
import { config, checkConfig } from '../lib/config.js';

checkConfig();
await mongoose.connect(config.mongoUri);

const db = mongoose.connection.db;
const collections = await db.listCollections({ name: 'chunks' }).toArray();
if (!collections.length) await db.createCollection('chunks');
const chunks = db.collection('chunks');

const existing = await chunks.listSearchIndexes(config.vectorIndexName).toArray();
if (existing.length) {
  console.log(`Index "${config.vectorIndexName}" already exists (status: ${existing[0].status}).`);
} else {
  await chunks.createSearchIndex({
    name: config.vectorIndexName,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: config.embeddingDimensions,
          similarity: 'cosine',
        },
        { type: 'filter', path: 'documentId' },
      ],
    },
  });
  console.log(`Index "${config.vectorIndexName}" is being created. It will take ~1 minute to become ready in Atlas.`);
}

await mongoose.disconnect();
