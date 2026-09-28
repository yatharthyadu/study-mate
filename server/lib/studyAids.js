import { Type } from '@google/genai';
import { generateJson, generateText } from './gemini.js';
import { STUDY_AIDS_PROMPT, TITLE_PROMPT } from './prompts.js';

const MAX_TITLE_LENGTH = 60;
// Enough text for a good overview without sending a whole textbook
const MAX_SUMMARY_INPUT_CHARS = 30000;

const STUDY_AIDS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['summary', 'suggestedQuestions'],
};

// Summary + 4 suggested questions for a newly uploaded PDF.
// Never throws: on any error the upload still succeeds, just without study aids.
export async function generateStudyAids(fileName, pages) {
  try {
    const text = pages
      .map((p) => p.text || '')
      .join('\n\n')
      .slice(0, MAX_SUMMARY_INPUT_CHARS);
    const result = await generateJson(STUDY_AIDS_PROMPT(fileName, text), STUDY_AIDS_SCHEMA);
    return {
      summary: String(result.summary || '').trim(),
      suggestedQuestions: (result.suggestedQuestions || [])
        .map((q) => String(q).trim())
        .filter(Boolean)
        .slice(0, 4),
    };
  } catch (err) {
    console.error(`Study aids failed for "${fileName}":`, err.message);
    return { summary: '', suggestedQuestions: [] };
  }
}

// Fallback title: the question itself, cut to a sensible length
function titleFromQuestion(question) {
  const clean = question.replace(/\s+/g, ' ').trim();
  return clean.length > MAX_TITLE_LENGTH ? `${clean.slice(0, MAX_TITLE_LENGTH - 1)}…` : clean;
}

// Short conversation title from the first question. Never throws.
export async function generateTitle(question) {
  try {
    const title = (await generateText(TITLE_PROMPT(question))).replace(/^["'\s]+|["'.\s]+$/g, '');
    return title ? title.slice(0, MAX_TITLE_LENGTH) : titleFromQuestion(question);
  } catch (err) {
    console.error('Title generation failed:', err.message);
    return titleFromQuestion(question);
  }
}
