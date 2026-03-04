import { useState } from 'react';
import './OutputPanel.css';
import { highlightReusedPhrases } from '../lib/voiceReuse';
import { ExtractOutlineResponse } from '../lib/pilotApi';

interface OutputPanelProps {
  outline: ExtractOutlineResponse['outline'] | null;
  draft: string | null;
  extractError: string | null;
  assembleError: string | null;
  voiceAnalysis: any;
}

function OutputPanel({ outline, draft, extractError, assembleError }: OutputPanelProps) {
  const [outlineExpanded, setOutlineExpanded] = useState(false);
  const [quotesExpanded, setQuotesExpanded] = useState(true);

  const copyToClipboard = async () => {
    if (draft) {
      await navigator.clipboard.writeText(draft);
      alert('Draft copied to clipboard!');
    }
  };

  const wordCount = draft ? draft.trim().split(/\s+/).length : 0;

  if (extractError) {
    return (
      <div className="output-panel">
        <h2>Output</h2>
        <div className="empty-state">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ color: '#e53e3e' }}>Error: {extractError}</p>
        </div>
      </div>
    );
  }

  if (assembleError) {
    return (
      <div className="output-panel">
        <h2>Output</h2>
        <div className="empty-state">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ color: '#e53e3e' }}>Error: {assembleError}</p>
        </div>
      </div>
    );
  }

  if (!outline && !draft) {
    return (
      <div className="output-panel">
        <h2>Output</h2>
        <div className="empty-state">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Click "1) Extract Outline" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="output-panel">
      <h2>Output</h2>

      {outline && (
        <>
          <div className="collapsible-section">
            <button
              className="collapsible-header"
              onClick={() => setOutlineExpanded(!outlineExpanded)}
            >
              <span>Outline (JSON)</span>
              <span className={`chevron ${outlineExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
            {outlineExpanded && (
              <div className="collapsible-content">
                <pre className="json-output">{JSON.stringify(outline, null, 2)}</pre>
              </div>
            )}
          </div>

          {outline.notable_quotes && outline.notable_quotes.length > 0 && (
            <div className="collapsible-section">
              <button
                className="collapsible-header"
                onClick={() => setQuotesExpanded(!quotesExpanded)}
              >
                <span>Quotes used ({outline.notable_quotes.length})</span>
                <span className={`chevron ${quotesExpanded ? 'expanded' : ''}`}>▼</span>
              </button>
              {quotesExpanded && (
                <div className="collapsible-content">
                  <div className="quotes-list">
                    {outline.notable_quotes.map((quote: string, index: number) => (
                      <div key={index} className="quote-item">
                        <span className="quote-number">{index + 1}</span>
                        <span className="quote-text">{quote}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {draft && (
        <div className="draft-section">
          <div className="draft-header">
            <h3>Draft</h3>
            <div className="draft-actions">
              <span className="word-count">{wordCount} words</span>
              <button className="copy-button" onClick={copyToClipboard}>
                Copy draft
              </button>
            </div>
          </div>
          <div className="draft-content">
            {outline?.notable_quotes && outline.notable_quotes.length > 0 ? (
              highlightReusedPhrases(draft, outline.notable_quotes).map((segment, index) => (
                segment.highlighted ? (
                  <mark key={index} style={{ backgroundColor: '#fef3c7', padding: '2px 0' }}>
                    {segment.text}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              ))
            ) : (
              draft
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OutputPanel;
