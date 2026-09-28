// All prompts sent to Gemini, in one place so they're easy to tweak

export const ANSWER_SYSTEM_PROMPT = `You are a helpful study assistant that answers only based on the provided PDF context.
The context may come from several PDFs; each source is labelled with its file name and page.
Rules:
- Use only the information given in the CONTEXT. Do not make things up.
- If the answer is not in the context, say clearly: "This information was not found in your PDFs."
- Cite the file name and page number wherever you use information, like (notes.pdf, page 3).
- Answer in the same language the user asks in.`;

export const STUDY_AIDS_PROMPT = (fileName, text) =>
  `You are helping a student study the document "${fileName}".
Based only on the text below:
- "summary": a 2-3 sentence summary of what the document covers.
- "suggestedQuestions": exactly 4 short, specific study questions a student could ask about it.
  Each question must be answerable from the text.
Write in the same language as the document.

DOCUMENT TEXT:
${text}`;

export const TITLE_PROMPT = (question) =>
  `Write a short title (3 to 6 words) for a study chat that starts with the question below.
Reply with the title only: no quotes, no trailing punctuation.

QUESTION: ${question}`;
