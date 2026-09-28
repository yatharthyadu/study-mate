# PDF Chat App (MERN + RAG)

Upload a PDF and ask questions about it. Answers come only from the PDF's content, with page numbers.

**Stack:** React + Vite + Tailwind · Express + multer + pdf-parse · Gemini (LLM + embeddings) · MongoDB Atlas Vector Search

## Folder structure

```
pdf-chat-app/
├── server/                    # Express backend
│   ├── index.js               # Starts the server, wires up routes
│   ├── lib/
│   │   ├── config.js          # .env values
│   │   ├── chunker.js         # Text -> chunks
│   │   ├── gemini.js          # Embeddings + LLM (streaming)
│   │   └── retriever.js       # Atlas Vector Search query
│   ├── models/
│   │   ├── Document.js        # PDF info
│   │   └── Chunk.js           # Chunk text + embedding
│   ├── routes/
│   │   ├── documents.js       # Upload / list / delete
│   │   └── chat.js            # Question -> answer
│   └── scripts/createIndex.js # Creates the vector index (run once)
└── client/                    # React frontend
    └── src/
        ├── App.jsx
        ├── api.js             # Backend calls
        └── components/
            ├── Sidebar.jsx    # Upload + PDF list
            └── ChatWindow.jsx # Chat UI + sources
```

## Setup (step by step)

### 1. Gemini API key (free)
Go to [Google AI Studio](https://aistudio.google.com/apikey) and create an API key.

### 2. MongoDB Atlas (free)
1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create an **M0 (free)** cluster.
2. Under *Database Access*, create a user (username + password).
3. Under *Network Access*, add your IP (`0.0.0.0/0` is fine while learning).
4. Copy the connection string from *Connect → Drivers*.

### 3. Run the backend
```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
# Open .env and fill in GEMINI_API_KEY and MONGODB_URI
npm run create-index        # First time only: creates the vector search index
npm run dev
```
You should see `MongoDB connected` and `Server running`.

> The index takes ~1 minute to become ready. You can check for status **READY** in the *Atlas Search* tab of the Atlas dashboard.

### 4. Run the frontend (in a new terminal)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser, upload a PDF, and ask questions.

## What happens under the hood (RAG flow)

**On upload** (`routes/documents.js`):
1. `pdf-parse` extracts the text of each page
2. `chunker.js` splits the text into ~1000-character chunks (with 200 characters of overlap)
3. `gemini.js` creates an embedding (a 768-number vector) for each chunk
4. Chunks + embeddings are saved to MongoDB

**On a question** (`routes/chat.js`):
1. An embedding is created for the question
2. `$vectorSearch` fetches the 5 most similar chunks (from that PDF only)
3. Chunks + question + previous chat are sent to Gemini
4. The answer streams in word by word, and sources are shown in the UI

## Common problems

| Problem | Solution |
|---|---|
| `Missing values in .env` | Did you create `server/.env`? Did you fill in the values? |
| MongoDB won't connect | Add your IP under Network Access in Atlas, and check the password |
| Answer is always "not found in the PDF" / empty sources | Is the vector index READY? Did you run `npm run create-index`? |
| "No text found in this PDF" | It's a scanned (image) PDF; it needs OCR |
| Model not found error | Gemini models change often; set `CHAT_MODEL` in `.env` to a current name from the [models page](https://ai.google.dev/gemini-api/docs/models) |

## What you could add next

- User login (JWT) so each user has their own PDFs
- Asking questions across multiple PDFs at once
- Saving chat history in MongoDB
- Turning retrieval into a tool to build an agent (Agentic RAG)
- OCR for scanned PDFs
