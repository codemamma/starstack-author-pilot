# Developer Guide

## Local Ollama Setup

This application requires a locally running Ollama instance for AI-powered content extraction and assembly.

### Prerequisites

1. Install Ollama from [ollama.ai](https://ollama.ai)

### Setup Commands

```bash
# Pull the required model
ollama pull llama3.1:8b

# Install server dependencies and start the dev server
cd server && npm i && npm run dev
```

The server will start on `http://127.0.0.1:5176` (configurable via `PORT` environment variable in `server/.env`).

### Configuration

Edit `server/.env` to customize:
- `PORT`: Server port (default: 5176)
- `OLLAMA_MODEL`: Ollama model to use (default: llama3.1:8b)
- `OLLAMA_URL`: Ollama instance URL (default: http://127.0.0.1:11434)

### API Endpoints

#### POST /extract
Extracts structured outline from source material.

**Request:**
```json
{
  "source": "string (required)",
  "author": "string (optional)"
}
```

**Response:**
```json
{
  "outline": {
    "title": "string",
    "author": "string or null",
    "thesis": {
      "statement": "string",
      "evidence_quotes": ["string"]
    },
    "sections": [...],
    "notable_quotes": ["string"],
    "constraints": {...}
  }
}
```

#### POST /assemble
Assembles outline into platform-specific content.

**Request:**
```json
{
  "platform": "substack" | "linkedin",
  "outline": object,
  "source": "string"
}
```

**Response:**
```json
{
  "draft": "string"
}
```

### Development

The server uses `tsx watch` for hot-reloading during development. Any changes to `server/index.ts` will automatically restart the server.
