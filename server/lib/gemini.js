import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// ---------- Embeddings: text -> numbers (vector) ----------

async function embed(texts, taskType) {
  const response = await ai.models.embedContent({
    model: config.embeddingModel,
    contents: texts,
    config: { taskType, outputDimensionality: config.embeddingDimensions },
  });
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

// ---------- LLM: context + question -> answer (streaming) ----------

const SYSTEM_PROMPT = `You are a helpful assistant that answers only based on the provided PDF context.
Rules:
- Use only the information given in the CONTEXT. Do not make things up.
- If the answer is not in the context, say clearly: "This information was not found in the PDF."
- Cite the page number wherever you use information, like (page 3).
- Answer in the same language the user asks in.`;

export async function* streamAnswer(question, chunks, history = []) {
  const context = chunks
    .map((c, i) => `[Source ${i + 1} | page ${c.page}]\n${c.text}`)
    .join('\n\n---\n\n');

  // Previous conversation (last 6 messages only) so follow-up questions make sense
  const past = history.slice(-6).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: config.chatModel,
    contents: [
      ...past,
      { role: 'user', parts: [{ text: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }] },
    ],
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  for await (const part of stream) {
    if (part.text) yield part.text;
  }
}
