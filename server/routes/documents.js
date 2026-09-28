import { Router } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { chunkPages } from '../lib/chunker.js';
import { embedDocuments } from '../lib/gemini.js';
import { Document } from '../models/Document.js';
import { Chunk } from '../models/Chunk.js';

const router = Router();

// The PDF is kept in memory (not saved to disk), max 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed')),
});

// POST /api/documents  -> upload + process a PDF (the "setup" step of RAG)
router.post('/', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please send a PDF file (field name: pdf)' });

  // Step 1: extract text from the PDF
  const parser = new PDFParse({ data: req.file.buffer });
  const { pages, total } = await parser.getText();
  await parser.destroy();

  // Step 2: split the text into chunks
  const chunks = chunkPages(pages);
  if (!chunks.length) {
    return res.status(422).json({
      error: 'No text found in this PDF. It may be a scanned (image) PDF.',
    });
  }

  // Step 3: create an embedding for each chunk
  const vectors = await embedDocuments(chunks.map((c) => c.text));

  // Step 4: save to MongoDB
  const doc = await Document.create({
    name: req.file.originalname,
    pages: total,
    chunkCount: chunks.length,
  });
  await Chunk.insertMany(
    chunks.map((c, i) => ({ documentId: doc._id, text: c.text, page: c.page, embedding: vectors[i] }))
  );

  console.log(`Processed "${doc.name}": ${total} pages, ${chunks.length} chunks`);
  res.status(201).json(doc);
});

// GET /api/documents  -> list all uploaded PDFs
router.get('/', async (req, res) => {
  const docs = await Document.find().sort({ createdAt: -1 });
  res.json(docs);
});

// DELETE /api/documents/:id  -> delete a PDF and its chunks
router.delete('/:id', async (req, res) => {
  await Chunk.deleteMany({ documentId: req.params.id });
  await Document.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
