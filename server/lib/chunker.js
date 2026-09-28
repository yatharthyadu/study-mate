// Splits text into small, slightly overlapping pieces (chunks).
// The overlap ensures an idea isn't cut off between two chunks.

const CHUNK_SIZE = 1000; // characters (~200 words)
const CHUNK_OVERLAP = 200;

function cleanText(text) {
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// pages: [{ num: 1, text: '...' }, ...]  (comes from pdf-parse)
export function chunkPages(pages) {
  const chunks = [];

  for (const page of pages) {
    const text = cleanText(page.text || '');
    if (!text) continue;

    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length);

      // Don't cut in the middle of a word: back up to the previous space/newline
      if (end < text.length) {
        const lastBreak = Math.max(text.lastIndexOf('\n', end), text.lastIndexOf(' ', end));
        if (lastBreak > start + CHUNK_SIZE / 2) end = lastBreak;
      }

      const piece = text.slice(start, end).trim();
      if (piece) chunks.push({ text: piece, page: page.num });

      if (end >= text.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }

  return chunks;
}
