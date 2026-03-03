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
