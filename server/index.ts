import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Agent } from 'undici';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5176;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const FAST_EXTRACT = process.env.FAST_EXTRACT !== 'false';
const TEXT_FAST_EXTRACT = (process.env.TEXT_FAST_EXTRACT ?? 'true') === 'true';

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

async function callOllama(request: OllamaGenerateRequest, routeLabel: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout | null = null;

  const format = request.format || 'text';
  console.log(`[ollama] start ${routeLabel} model=${request.model} format=${format}`);

  try {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

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

const TEXT_FAST_EXTRACTION_PROMPT = `You are an expert content analyzer. Extract ONLY what is explicitly stated in the source.

STRICT RULES:
- Extract ONLY information from the source
- Do NOT add your own ideas or interpretations
- Use the exact template below
- No extra commentary

Template:
TITLE: ...
AUTHOR: ...
THESIS: ...
THESIS_QUOTE: "..."
BULLETS:
- ... || "..."
- ... || "..."
- ... || "..."
QUOTES:
- "..."
- "..."
- "..."

Rules for BULLETS: Exactly 3 lines, each line is: - point || "verbatim quote from source"
Rules for QUOTES: Exactly 3 verbatim quotes from the source

Source material to analyze:
{SOURCE}

{AUTHOR_INSTRUCTION}

Extract the information using the template above:`;

const FAST_EXTRACTION_PROMPT = `You are an expert content analyzer. Your task is to extract ONLY what is explicitly stated in the provided source material.

STRICT RULES:
- Extract ONLY information that appears in the source
- Do NOT add your own ideas, interpretations, or knowledge
- Every bullet point MUST include an evidence_quote from the source
- Return ONLY valid JSON, no explanatory text

Required JSON schema:
{
  "title": "string",
  "author": "string or null",
  "thesis": {
    "statement": "string",
    "evidence_quotes": ["string (1-2 quotes)"]
  },
  "bullets": [
    {
      "point": "string",
      "evidence_quote": "string"
    }
  ],
  "notable_quotes": ["string (3-6 verbatim lines from source)"]
}

Source material to analyze:
{SOURCE}

{AUTHOR_INSTRUCTION}

Extract 3-6 bullet points with evidence. Return JSON:`;

const FULL_EXTRACTION_PROMPT = `You are an expert content analyzer. Your task is to extract ONLY what is explicitly stated in the provided source material.

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

const ASSEMBLY_PROMPT_SUBSTACK = `You are writing a post in the author's natural voice. Expand the ideas from the outline into a full post that sounds like the author speaking directly.

GROUNDING RULES (VERY IMPORTANT):
Use ONLY ideas present in:
- source
- outline.bullets
- outline.notable_quotes

Do not introduce new explanations or analogies.

You MUST include at least two quotes from outline.notable_quotes.
Quotes must appear exactly as written and must be surrounded by quotation marks.

Example:
"More examples provide more guidance but take more time."

If you cannot follow these rules, stop generation.

STRICT RULES:
1. Write as the author, not as someone summarizing the author
2. No meta language: "this article," "generated," "optimized," "here's what makes this compelling"
3. Expand bullet points into full paragraphs using the author's voice
4. Quotes must appear as natural sentences within paragraphs - never list quotes separately

SUBSTACK FORMATTING:
- Start with the title
- Write 3-5 short sections
- Each section should use information directly from the outline
- Paragraphs can be longer (3-5 sentences)
- Target length: 300-450 words
- End the article with a question based on the thesis

SOURCE MATERIAL:
{SOURCE}

OUTLINE TO ASSEMBLE:
{OUTLINE}

Write the Substack post as plain text:`;

const ASSEMBLY_PROMPT_LINKEDIN = `You are writing a LinkedIn post in the author's natural voice. Expand the ideas from the outline into a full post that sounds like the author speaking directly.

GROUNDING RULES (VERY IMPORTANT):
Use ONLY ideas present in:
- source
- outline.bullets
- outline.notable_quotes

Do not introduce new explanations or analogies.

You MUST include at least two quotes from outline.notable_quotes.
Quotes must appear exactly as written and must be surrounded by quotation marks.

Example:
"More examples provide more guidance but take more time."

If you cannot follow these rules, stop generation.

STRICT RULES:
1. Write as the author, not as someone summarizing the author
2. No meta language: "this article," "generated," "optimized," "here's what makes this compelling"
3. Expand bullet points into full paragraphs using the author's voice
4. Quotes must appear as natural sentences within paragraphs - never list quotes separately

LINKEDIN FORMAT:
- First line must be a hook sentence (compelling, direct)
- No headings
- Short paragraphs (1-2 sentences per paragraph)
- Maximum 1 emoji total (optional)
- Target length: 120-180 words
- Closing question tied to thesis

SOURCE MATERIAL:
{SOURCE}

OUTLINE TO ASSEMBLE:
{OUTLINE}

Write the LinkedIn post as plain text:`;

function parseTextExtraction(text: string): any {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  let title = '';
  let author: string | null = null;
  let thesisStatement = '';
  let thesisQuote = '';
  const bullets: Array<{ point: string; evidence_quote: string }> = [];
  const notableQuotes: string[] = [];

  let section = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('TITLE:')) {
      title = line.substring(6).trim();
    } else if (line.startsWith('AUTHOR:')) {
      const authorText = line.substring(7).trim();
      author = (authorText && authorText.toLowerCase() !== 'null' && authorText !== '...') ? authorText : null;
    } else if (line.startsWith('THESIS:')) {
      thesisStatement = line.substring(7).trim();
    } else if (line.startsWith('THESIS_QUOTE:')) {
      thesisQuote = line.substring(13).trim().replace(/^"|"$/g, '');
    } else if (line === 'BULLETS:') {
      section = 'BULLETS';
    } else if (line === 'QUOTES:') {
      section = 'QUOTES';
    } else if (line.startsWith('-') && section === 'BULLETS') {
      const content = line.substring(1).trim();
      const parts = content.split('||').map(p => p.trim());
      if (parts.length >= 2) {
        const point = parts[0];
        const quote = parts[1].replace(/^"|"$/g, '');
        bullets.push({ point, evidence_quote: quote });
      }
    } else if (line.startsWith('-') && section === 'QUOTES') {
      const quote = line.substring(1).trim().replace(/^"|"$/g, '');
      if (quote) {
        notableQuotes.push(quote);
      }
    }
  }

  return {
    title: title || 'Untitled',
    author,
    thesis: {
      statement: thesisStatement || 'No thesis extracted',
      evidence_quotes: thesisQuote ? [thesisQuote] : []
    },
    bullets,
    notable_quotes: notableQuotes
  };
}

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

    let extractionPrompt: string;
    let numPredict: number;
    let useJsonFormat: boolean;

    if (TEXT_FAST_EXTRACT) {
      extractionPrompt = TEXT_FAST_EXTRACTION_PROMPT;
      numPredict = 160;
      useJsonFormat = false;
    } else if (FAST_EXTRACT) {
      extractionPrompt = FAST_EXTRACTION_PROMPT;
      numPredict = 300;
      useJsonFormat = true;
    } else {
      extractionPrompt = FULL_EXTRACTION_PROMPT;
      numPredict = 450;
      useJsonFormat = true;
    }

    const prompt = extractionPrompt
      .replace('{SOURCE}', source)
      .replace('{AUTHOR_INSTRUCTION}', authorInstruction);

    const ollamaRequest: OllamaGenerateRequest = {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0,
        num_predict: numPredict,
      },
    };

    if (useJsonFormat) {
      ollamaRequest.format = 'json';
    }

    const response = await callOllama(ollamaRequest, '/extract', 90000);

    let outline;

    if (TEXT_FAST_EXTRACT) {
      try {
        outline = parseTextExtraction(response);
      } catch (parseError) {
        console.error('Failed to parse text extraction response:', response);
        return res.status(500).json({
          error: 'Failed to parse text extraction',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
      }
    } else {
      try {
        outline = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse Ollama JSON response:', response);
        return res.status(500).json({
          error: 'Failed to parse outline JSON',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
      }
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

    const numPredict = platform === 'linkedin' ? 260 : 420;

    const draft = await callOllama({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: numPredict,
      },
    }, '/assemble', 180000);

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
  console.log(`Text fast extraction mode: ${TEXT_FAST_EXTRACT ? 'enabled' : 'disabled'}`);
  console.log(`Fast extraction mode: ${FAST_EXTRACT ? 'enabled' : 'disabled'}`);
});
