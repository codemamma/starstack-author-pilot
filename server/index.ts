import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Agent } from 'undici';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5176;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const dispatcher = new Agent({
  headersTimeout: 600000,
  bodyTimeout: 600000,
  connectTimeout: 60000,
});

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  format?: string;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

class OllamaTimeoutError extends Error {
  constructor(stage: string) {
    super(`Ollama timeout after 90 seconds`);
    this.name = 'OllamaTimeoutError';
    this.stage = stage;
  }
  stage: string;
}

async function callOllama(request: OllamaGenerateRequest, routeLabel: string): Promise<string> {
  const controller = new AbortController();
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout | null = null;

  const format = request.format || 'text';
  console.log(`[ollama] start ${routeLabel} model=${request.model} format=${format}`);

  try {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
      // @ts-ignore - undici dispatcher is valid but TypeScript doesn't recognize it
      dispatcher,
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OllamaGenerateResponse;
    const elapsed = Date.now() - startTime;
    console.log(`[ollama] done ${routeLabel} ms=${elapsed}`);

    return data.response;
  } catch (error) {
    const elapsed = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      const stage = routeLabel.replace('/', '');
      console.error(`[ollama] error ${routeLabel} ms=${elapsed} Ollama timeout`);
      throw new OllamaTimeoutError(stage);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ollama] error ${routeLabel} ms=${elapsed} ${message}`);
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

const EXTRACTION_PROMPT = `You are an expert content analyzer. Your task is to extract ONLY what is explicitly stated in the provided source material.

STRICT RULES:
- Extract ONLY information that appears in the source
- Do NOT add your own ideas, interpretations, or knowledge
- Do NOT infer anything not explicitly stated
- Every extracted point MUST include evidence_quotes from the source
- Return ONLY valid JSON, no explanatory text

Required JSON schema:
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

Source material to analyze:
{SOURCE}

{AUTHOR_INSTRUCTION}

Extract the outline as JSON:`;

const ASSEMBLY_PROMPT_SUBSTACK = `You are a content writer who transforms outlines into authentic posts. Your goal is to create a post that reads like it was written by the original author.

NON-NEGOTIABLE RULES:
1. Use ONLY ideas from the source material - no new concepts
2. Reuse original phrasing heavily - aim for 40% or more sentences as direct or lightly edited quotes
3. Include 3-6 short verbatim quotes from the source
4. No marketing filler or meta commentary
5. Keep it grounded in what the source actually says

STRUCTURE:
- Title (compelling but grounded)
- Short intro paragraph
- Headers for main sections
- Short paragraphs (2-4 sentences)
- End with a grounded reflective question
- Add "Source-derived checklist" at the end listing: number of reused quotes and sections covered

SOURCE MATERIAL:
{SOURCE}

OUTLINE TO ASSEMBLE:
{OUTLINE}

Write the Substack post:`;

const ASSEMBLY_PROMPT_LINKEDIN = `You are a content writer who transforms outlines into authentic LinkedIn posts. Your goal is to create a post that reads like it was written by the original author.

NON-NEGOTIABLE RULES:
1. Use ONLY ideas from the source material - no new concepts
2. Reuse original phrasing heavily - aim for 40% or more sentences as direct or lightly edited quotes
3. Include 2-4 short verbatim quotes from the source
4. No marketing filler or meta commentary
5. Strong hook in the first 2 lines
6. Use numbered sections for clarity
7. Short lines (1-2 sentences per paragraph)
8. End with a grounded question
9. Keep it grounded in what the source actually says

SOURCE MATERIAL:
{SOURCE}

OUTLINE TO ASSEMBLE:
{OUTLINE}

Write the LinkedIn post:`;

app.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    model: OLLAMA_MODEL,
    ollamaUrl: OLLAMA_URL,
  });
});

app.post('/extract', async (req: Request, res: Response) => {
  try {
    const { source, author } = req.body;

    if (!source) {
      return res.status(400).json({ error: 'Missing required field: source' });
    }

    if (source.length > 12000) {
      return res.status(400).json({
        error: 'Source too long for demo; please paste a smaller excerpt (<=12k chars).'
      });
    }

    const authorInstruction = author
      ? `Author attribution: ${author}`
      : 'Author: determine from source or set to null';

    const prompt = EXTRACTION_PROMPT
      .replace('{SOURCE}', source)
      .replace('{AUTHOR_INSTRUCTION}', authorInstruction);

    const response = await callOllama({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
        num_predict: 450,
      },
    }, '/extract');

    let outline;
    try {
      outline = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse Ollama JSON response:', response);
      return res.status(500).json({
        error: 'Failed to parse outline JSON',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      });
    }

    res.json({ outline });
  } catch (error) {
    console.error('Extract error:', error);

    if (error instanceof OllamaTimeoutError) {
      return res.status(504).json({
        error: 'Ollama timeout',
        stage: 'extract'
      });
    }

    res.status(500).json({
      error: 'Extraction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/assemble', async (req: Request, res: Response) => {
  try {
    const { platform, outline, source } = req.body;

    if (!platform || !outline || !source) {
      return res.status(400).json({
        error: 'Missing required fields: platform, outline, source'
      });
    }

    if (platform !== 'substack' && platform !== 'linkedin') {
      return res.status(400).json({
        error: 'Invalid platform. Must be "substack" or "linkedin"'
      });
    }

    const promptTemplate = platform === 'substack'
      ? ASSEMBLY_PROMPT_SUBSTACK
      : ASSEMBLY_PROMPT_LINKEDIN;

    const prompt = promptTemplate
      .replace('{SOURCE}', source)
      .replace('{OUTLINE}', JSON.stringify(outline, null, 2));

    const numPredict = platform === 'substack' ? 900 : 650;

    const draft = await callOllama({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: numPredict,
      },
    }, '/assemble');

    res.json({ draft });
  } catch (error) {
    console.error('Assemble error:', error);

    if (error instanceof OllamaTimeoutError) {
      return res.status(504).json({
        error: 'Ollama timeout',
        stage: 'assemble'
      });
    }

    res.status(500).json({
      error: 'Assembly failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Using Ollama model: ${OLLAMA_MODEL}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
});
