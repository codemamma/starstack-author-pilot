const PILOT_API_BASE = import.meta.env.VITE_PILOT_API_BASE || "http://localhost:5176";

export function getApiBaseUrl(): string {
  return PILOT_API_BASE;
}

export interface HealthCheckResponse {
  ok: boolean;
  time: string;
  model: string;
  ollamaUrl: string;
}

export interface ExtractOutlineRequest {
  source: string;
  author?: string;
}

export interface ExtractOutlineResponse {
  outline: {
    title: string;
    author: string | null;
    thesis: {
      statement: string;
      evidence_quotes: string[];
    };
    sections: Array<{
      heading: string;
      key_points: Array<{
        point: string;
        evidence_quotes: string[];
      }>;
      examples: string[];
      terms: string[];
    }>;
    notable_quotes: string[];
    constraints: {
      what_source_does_not_say: string[];
      tone_tags: string[];
    };
  };
}

export interface AssembleDraftRequest {
  platform: "substack" | "linkedin";
  outline: ExtractOutlineResponse["outline"];
  source: string;
}

export interface AssembleDraftResponse {
  draft: string;
}

function createFriendlyError(error: unknown, endpoint: string): Error {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return new Error(`Local server not running on ${PILOT_API_BASE}. Start server: cd server && npm run dev`);
  }

  if (error instanceof Error) {
    if (error.message.includes('CORS') || error.message.includes('cors')) {
      return new Error('CORS blocked. Ensure server is running and CORS enabled.');
    }
    return error;
  }

  return new Error(`${endpoint} failed: ${String(error)}`);
}

export async function checkHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch(`${PILOT_API_BASE}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    throw createFriendlyError(error, 'Health check');
  }
}

export async function extractOutline(
  request: ExtractOutlineRequest
): Promise<ExtractOutlineResponse> {
  try {
    const response = await fetch(`${PILOT_API_BASE}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Extract failed: ${error}`);
    }

    return response.json();
  } catch (error) {
    throw createFriendlyError(error, 'Extract');
  }
}

export async function assembleDraft(
  request: AssembleDraftRequest
): Promise<AssembleDraftResponse> {
  try {
    const response = await fetch(`${PILOT_API_BASE}/assemble`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Assembly failed: ${error}`);
    }

    return response.json();
  } catch (error) {
    throw createFriendlyError(error, 'Assemble');
  }
}
