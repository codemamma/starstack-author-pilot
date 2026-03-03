# Stage 1 – Source-Bound Structural Extraction

## Overview

Stage 1 implements a **source-bound extraction pipeline** that converts a book chapter into structured JSON without introducing new ideas.

This stage is designed to:

- Prevent hallucination
- Preserve author voice
- Enforce evidence-backed structure
- Prepare clean input for Stage 2 (platform-specific assembly)

This is not generative writing.
It is structured editorial extraction.

---

## Architecture

Frontend (React)
→ Local API Server (Express, port 5176)
→ Ollama (local model runtime, port 11434)
→ Model: llama3.1:8b

All inference runs locally.
No cloud API calls.
No external data sharing.

---

## Extraction Guarantees

The Stage 1 prompt enforces:

1. No new ideas beyond the source.
2. Every extracted claim must include `evidence_quotes`.
3. JSON-only output (no markdown, no commentary).
4. Verbatim phrasing preferred.
5. If unclear → omit instead of guessing.

---
## System Requirements

- macOS
- Node.js v20.19+ or v22+
- Homebrew installed

Check your Node version:

```bash
node -v
```
---

## Local development setup

#Install Ollama

- Install using homebrew:
```bash
brew install ollama

- verify installation
```bash
ollama --version

# Pull the required model

- This project defaults to:
```code
llama3.1:8b

- pull the model
```bash
ollama pull llama3.1:8b

- verify:
```bash
ollama list

#Start Ollama
- Run:
```bash
ollama serve

- You should see:
```code
Listening on 127.0.0.1:11434

Leave this terminal window running

#Start the local API Server
Open a new terminal tab:
```bash
cd server
npm install
npm run dev

Expected output:
```code
Server running on http://localhost:5176
Using Ollama model: llama3.1:8b
Ollama URL: http://127.0.0.1:11434

# Start the frontend
Open another terminal tab in the project window
```bash
npm install
npm run dev

Open the Vite local URL shown in terminal

---
## Architecture Overview
Frontend (React)
    ↓
Local API Server (Express) – port 5176
    ↓
Ollama (Local LLM runtime) – port 11434

---
### Stage 1 – Source-Bound Structural Extraction
## Purpose

Stage 1 converts a book chapter into structured JSON without generating new ideas.

It is designed to:

- Prevent hallucination
- Preserve author terminology
- Require evidence-backed claims
- Prepare structured input for Stage 2 assembly

This stage performs structured editorial extraction — not generative writing.

## Extraction Guarantees

The extraction prompt enforces:

- No new ideas beyond the source.
- Every extracted claim must include evidence_quotes.
- JSON-only output (no markdown, no commentary).
- Verbatim phrasing preferred.
- If unclear → omit rather than guess.
---

## Output Schema

```json
{
  "title": "string",
  "author": "string or null",
  "thesis": {
    "statement": "string",
    "evidence_quotes": ["string"]
  },
  "sections": [
    {
      "heading": "string",
      "key_points": [
        {
          "point": "string",
          "evidence_quotes": ["string"]
        }
      ],
      "examples": ["string"],
      "terms": ["string"]
    }
  ],
  "notable_quotes": ["string"],
  "constraints": {
    "what_source_does_not_say": ["string"],
    "tone_tags": ["string"]
  }
}
---

###Quick smke test
```bash
curl -X POST http://localhost:5176/extract \
  -H "Content-Type: application/json" \
  -d '{"source":"Writing great prompts is a foundational skill in AI engineering.","author":"Sam Bhagwat"}'

If JSON is returned -> Stage 1 is working correctly

---
## macOS Localhost Fix(Important)
Some macOS setups resolve localhost to IPv6 first, which can cause:
```code
Extraction failed: fetch failed

if this occurs, restart the server with:
```bash
OLLAMA_URL=http://127.0.0.1:11434 npm run dev

This forces IPv4 and resolves the issue.
