import 'dotenv/config';

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  mongoUri: process.env.MONGODB_URI,
  chatModel: process.env.CHAT_MODEL || 'gemini-flash-latest',
  embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS || 768),
  port: Number(process.env.PORT || 5000),
  // Secret used to sign login tokens (JWT). Must be long and random.
  jwtSecret: process.env.JWT_SECRET,
  isProduction: process.env.NODE_ENV === 'production',
  // Name of the vector index created in Atlas
  vectorIndexName: 'chunk_vector_index',
};

export function checkConfig() {
  const missing = [];
  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');
  if (!config.mongoUri) missing.push('MONGODB_URI');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    console.error(`\nMissing values in .env: ${missing.join(', ')}`);
    console.error('Copy server/.env.example to create server/.env.\n');
    process.exit(1);
  }
}
