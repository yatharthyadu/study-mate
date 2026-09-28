import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { withRetry } from './retry.js';
import { ANSWER_SYSTEM_PROMPT } from './prompts.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// ---------- Embeddings: text -> numbers (vector) ----------

async function embed(texts, taskType) {
  const response = await withRetry(() =>
    ai.models.embedContent({
      model: config.embeddingModel,
      contents: texts,
      config: { taskType, outputDimensionality: config.embeddingDimensions },
    })
  );
  return response.embeddings.map((e) => e.values);
}

// For PDF chunks (many at once, in batches of 50)
export async function embedDocuments(texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    vectors.push(...(await embed(batch, 'RETRIEVAL_DOCUMENT')));
  }
  return vectors;
}

// For the user's question
export async function embedQuery(question) {
  const [vector] = await embed([question], 'RETRIEVAL_QUERY');
  return vector;
}

// ---------- LLM: one-shot text (titles etc.) ----------

export async function generateText(prompt) {
  const response = await withRetry(() =>
    ai.models.generateContent({ model: config.chatModel, contents: prompt })
  );
  return (response.text || '').trim();
}

// ---------- LLM: context + question -> answer (streaming) ----------

export async function* streamAnswer(question, chunks, history = []) {
  const context = chunks
    .map((c, i) => `[Source ${i + 1} | ${c.documentName}, page ${c.page}]\n${c.text}`)
    .join('\n\n---\n\n');

  // Previous conversation (last 6 messages only) so follow-up questions make sense
  const past = history.slice(-6).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Only starting the stream is retried; once text is flowing we can't restart it
  const stream = await withRetry(() =>
    ai.models.generateContentStream({
      model: config.chatModel,
      contents: [
        ...past,
        { role: 'user', parts: [{ text: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }] },
      ],
      config: { systemInstruction: ANSWER_SYSTEM_PROMPT },
    })
  );

  for await (const part of stream) {
    if (part.text) yield part.text;
  }
}
