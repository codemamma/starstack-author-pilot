const PILOT_API_BASE = import.meta.env.VITE_PILOT_API_BASE || "http://localhost:5176";

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

export async function extractOutline(
  request: ExtractOutlineRequest
): Promise<ExtractOutlineResponse> {
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
}

export async function assembleDraft(
  request: AssembleDraftRequest
): Promise<AssembleDraftResponse> {
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
}
