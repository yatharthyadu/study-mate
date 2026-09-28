import { generateText } from './gemini.js';
import { TITLE_PROMPT } from './prompts.js';

const MAX_TITLE_LENGTH = 60;

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
