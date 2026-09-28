# StudyMate: AI Study Assistant (MERN + RAG)

Upload your notes and textbooks as PDFs and ask questions about them. Every answer is grounded in **your** material and cited by file and page, e.g. *(biology-notes.pdf, page 7)*.

**Stack:** React + Vite + Tailwind · Express 5 + multer + pdf-parse · Gemini (LLM + embeddings) · MongoDB Atlas Vector Search · JWT auth (bcrypt, httpOnly cookie)

## Features

- **Accounts:** email + password signup/login. Passwords are hashed with bcrypt, and sessions use a JWT in an httpOnly cookie. Each user only ever sees their own PDFs and chats, and the vector search itself is filtered by user.
- **Chat with one or more PDFs:** pick any combination of your PDFs for a chat. Answers cite the file name and page.
- **Persistent chat history:** every question and answer is saved. Past chats are listed in the sidebar, each with an auto-generated title.
- **Study aids on upload:** each PDF gets a 2–3 sentence summary and 4 suggested study questions, shown as clickable chips in a new chat.
- **Streaming answers** with expandable sources (file, page, similarity score, preview).
- **Responsive UI:** the sidebar becomes a slide-in drawer on mobile.
- **Resilient Gemini calls:** automatic retries with backoff on 429/503 errors.

## Folder structure

```
pdf-chat-app/
├── server/                       # Express backend
│   ├── index.js                  # Starts the server, wires up middleware and routes
│   ├── middleware/auth.js        # requireAuth: reads the login cookie, sets req.userId
│   ├── lib/
│   │   ├── config.js             # .env values
│   │   ├── auth.js               # JWT sign/verify + cookie options
│   │   ├── chunker.js            # Text -> chunks
│   │   ├── gemini.js             # Embeddings, JSON output, streaming answers
│   │   ├── prompts.js            # All prompts in one place
│   │   ├── retriever.js          # Atlas Vector Search query (userId + documentIds filter)
│   │   ├── retry.js              # withRetry: backoff for 429/503
│   │   └── studyAids.js          # PDF summary + suggested questions, chat titles
│   ├── models/
│   │   ├── User.js               # Email + password hash
│   │   ├── Document.js           # PDF info + summary + suggested questions
│   │   ├── Chunk.js              # Chunk text + embedding
│   │   ├── Conversation.js       # A chat: its PDFs and title
│   │   └── Message.js            # One question or answer (+ sources)
│   ├── routes/
│   │   ├── auth.js               # Signup / login / logout / me
│   │   ├── documents.js          # Upload / list / delete
│   │   ├── conversations.js      # List / create / open / delete chats
│   │   └── chat.js               # Question -> streamed answer (saved to history)
│   └── scripts/createIndex.js    # (Re)creates the vector search index
└── client/                       # React frontend
    └── src/
        ├── App.jsx               # Routes: /login, /signup, / (protected)
        ├── api.js                # All backend calls
        ├── auth/                 # AuthContext + route guards
        ├── pages/                # Login, Signup, ChatPage
        └── components/           # Sidebar, ChatWindow, DocumentPicker, SuggestedQuestions, ...
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
# Open .env and fill in GEMINI_API_KEY, MONGODB_URI and JWT_SECRET
npm run create-index        # Creates the vector search index and waits until it's READY
npm run dev
```
Generate a `JWT_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
You should see `MongoDB connected` and `Server running`.

> Run `npm run create-index` again whenever the index definition changes. It drops the old index, recreates it, and removes any old PDFs that don't belong to a user.

### 4. Run the frontend (in a new terminal)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`, sign up, upload a PDF, and start asking questions.

## Environment variables (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | yes | Google AI Studio API key |
| `MONGODB_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | Long random string used to sign login tokens |
| `CHAT_MODEL` | no | Default `gemini-flash-latest` |
| `EMBEDDING_MODEL` | no | Default `gemini-embedding-001` |
| `EMBEDDING_DIMENSIONS` | no | Default `768` (must match the index) |
| `PORT` | no | Default `5000` |
| `NODE_ENV` | no | Set to `production` to mark the cookie `secure` (HTTPS only) |

## API

Every route except `/api/health` and `/api/auth/*` requires the login cookie.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` · `/api/auth/login` | `{ email, password }`: sets the cookie |
| POST | `/api/auth/logout` | Clears the cookie |
| GET | `/api/auth/me` | The logged-in user |
| GET · POST | `/api/documents` | List PDFs · upload one (`multipart`, field `pdf`) |
| DELETE | `/api/documents/:id` | Delete a PDF and its chunks |
| GET · POST | `/api/conversations` | List chats · create one with `{ documentIds }` |
| GET · DELETE | `/api/conversations/:id` | Open a chat (with messages) · delete it |
| POST | `/api/chat` | `{ conversationId, question }`: streams the answer; sources are in the `X-Sources` header |

## What happens under the hood (RAG flow)

**On upload** (`routes/documents.js`):
1. `pdf-parse` extracts the text of each page
2. `chunker.js` splits the text into ~1000-character chunks (with 200 characters of overlap)
3. In parallel:
   - `gemini.js` creates an embedding (a 768-number vector) for each chunk
   - `studyAids.js` asks Gemini for a summary + 4 study questions, using structured JSON output. If this fails, the upload still succeeds without them.
4. The document, chunks and embeddings are saved to MongoDB, tagged with the user's id

**On a question** (`routes/chat.js`):
1. The chat's last 6 messages are loaded from MongoDB as history
2. An embedding is created for the question
3. `$vectorSearch` fetches the most similar chunks, filtered to **this user** and **this chat's PDFs** (5 chunks for one PDF, 8 for several)
4. Chunks (labelled with file name and page) + question + history are sent to Gemini
5. The answer streams in word by word; the question and full answer are saved to the chat
6. On a chat's first question, a short title is generated in parallel

## Common problems

| Problem | Solution |
|---|---|
| `Missing values in .env` | Did you create `server/.env`? Did you fill in `GEMINI_API_KEY`, `MONGODB_URI` and `JWT_SECRET`? |
| MongoDB won't connect | Add your IP under Network Access in Atlas, and check the password |
| Answer is always "not found in your PDFs" / empty sources | Is the vector index READY? Did you run `npm run create-index` after updating? |
| Old PDFs disappeared after updating | PDFs uploaded before accounts existed have no owner and are removed by `create-index`. Re-upload them. |
| Keeps sending you back to the login page | The cookie is missing or expired, or `JWT_SECRET` changed. Log in again. |
| "No text found in this PDF" | It's a scanned (image) PDF; it needs OCR |
| No summary / suggested questions | The study-aids call failed (see server logs); the PDF still works for chat |
| Model not found error | Gemini models change often; set `CHAT_MODEL` in `.env` to a current name from the [models page](https://ai.google.dev/gemini-api/docs/models) |

## Roadmap

- Flashcards and quizzes generated from your PDFs
- Retrieval as a tool for an agent (Agentic RAG)
- OCR for scanned PDFs
- Deployment (Render/Railway + Vercel) with production cookie settings
