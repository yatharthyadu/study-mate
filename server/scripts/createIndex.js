// Run whenever the index definition changes: npm run create-index
// 1. Deletes old PDFs/chunks that have no owner (uploaded before accounts existed)
// 2. Drops the vector search index on the "chunks" collection (if it exists)
// 3. Recreates it and waits until Atlas reports it READY

import mongoose from 'mongoose';
import { config, checkConfig } from '../lib/config.js';

const POLL_MS = 5000;
const TIMEOUT_MS = 5 * 60 * 1000;

const INDEX_DEFINITION = {
  fields: [
    {
      type: 'vector',
      path: 'embedding',
      numDimensions: config.embeddingDimensions,
      similarity: 'cosine',
    },
    // Fields that $vectorSearch is allowed to filter on
    { type: 'filter', path: 'userId' },
    { type: 'filter', path: 'documentId' },
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getIndex(collection) {
  const [index] = await collection.listSearchIndexes(config.vectorIndexName).toArray();
  return index;
}

checkConfig();
await mongoose.connect(config.mongoUri);

const db = mongoose.connection.db;
const collections = await db.listCollections({ name: 'chunks' }).toArray();
if (!collections.length) await db.createCollection('chunks');
const chunks = db.collection('chunks');

// Step 1: remove legacy data without a userId
const noOwner = { userId: { $exists: false } };
const oldChunks = await chunks.deleteMany(noOwner);
const oldDocs = await db.collection('documents').deleteMany(noOwner);
console.log(`Removed ${oldDocs.deletedCount} old PDFs and ${oldChunks.deletedCount} old chunks without an owner.`);

// Step 2: drop the existing index and wait until it's really gone
if (await getIndex(chunks)) {
  console.log(`Dropping index "${config.vectorIndexName}"...`);
  await chunks.dropSearchIndex(config.vectorIndexName);
  while (await getIndex(chunks)) await sleep(POLL_MS);
}

// Step 3: create it again and wait for READY
await chunks.createSearchIndex({ name: config.vectorIndexName, type: 'vectorSearch', definition: INDEX_DEFINITION });
console.log(`Creating index "${config.vectorIndexName}" (filters: userId, documentId). Waiting for READY...`);

const startedAt = Date.now();
let status;
while (Date.now() - startedAt < TIMEOUT_MS) {
  status = (await getIndex(chunks))?.status;
  if (status === 'READY') break;
  await sleep(POLL_MS);
}
console.log(
  status === 'READY'
    ? 'Index is READY.'
    : `Index status is "${status}". Check the Atlas Search tab; it should become READY shortly.`
);

await mongoose.disconnect();
