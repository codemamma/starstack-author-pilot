import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InputPanel from '../components/InputPanel';
import OutputPanel from '../components/OutputPanel';
import './ReverseEngineerPage.css';

import { extractOutline, assembleDraft, ExtractOutlineResponse } from '../lib/pilotApi';
import { analyzeVoiceReuse } from '../lib/voiceReuse';

const STORAGE_KEY = 'reverseEngineerData';

interface StoredData {
  chapterText: string;
  authorName: string;
  platform: string;
}

function ReverseEngineerPage() {
  const [chapterText, setChapterText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [outline, setOutline] = useState<ExtractOutlineResponse['outline'] | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [extractElapsed, setExtractElapsed] = useState(0);
  const [assembleElapsed, setAssembleElapsed] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored);
        setChapterText(data.chapterText || '');
        setAuthorName(data.authorName || '');
        setPlatform(data.platform || 'LinkedIn');
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    }
  }, []);

  useEffect(() => {
    const data: StoredData = {
      chapterText,
      authorName,
      platform,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [chapterText, authorName, platform]);

  const handleExtractOutline = async () => {
    if (!chapterText.trim()) {
      alert('Please enter chapter text');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setOutline(null);
    setDraft(null);
    setExtractElapsed(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setExtractElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    try {
      const extractResponse = await extractOutline({
        source: chapterText,
        author: authorName || undefined,
      });
      setOutline(extractResponse.outline);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      clearInterval(interval);
      setExtractElapsed(Math.floor((Date.now() - startTime) / 1000));
      setIsExtracting(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!outline) return;

    setIsAssembling(true);
    setAssembleError(null);
    setDraft(null);
    setAssembleElapsed(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setAssembleElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    try {
      const assembleResponse = await assembleDraft({
        platform: platform.toLowerCase() as "substack" | "linkedin",
        outline,
        source: chapterText,
      });

      setDraft(assembleResponse.draft);
    } catch (err) {
      setAssembleError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      clearInterval(interval);
      setAssembleElapsed(Math.floor((Date.now() - startTime) / 1000));
      setIsAssembling(false);
    }
  };

  const voiceAnalysis = draft && outline ? analyzeVoiceReuse(
    draft,
    chapterText,
    outline.notable_quotes || []
  ) : null;

  return (
    <div className="reverse-engineer-page">
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="back-link">← Back</Link>
          <h1>Reverse Engineer: Chapter → Long-form Post</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="diagnostics-section">
          <button
            className="diagnostics-toggle"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            {showDiagnostics ? '▼' : '▶'} Diagnostics
          </button>

          {showDiagnostics && (
            <div className="diagnostics-panel">
              <div className="diagnostic-item">
                <strong>API Base URL:</strong> {getApiBaseUrl()}
              </div>

              <div className="diagnostic-item">
                <button
                  onClick={handleCheckHealth}
                  disabled={isCheckingHealth}
                  className="check-server-btn"
                >
                  {isCheckingHealth ? 'Checking...' : 'Check Server'}
                </button>

                {healthStatus && (
                  <div className="health-response">
                    <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
                  </div>
                )}

                {healthError && (
                  <div className="health-error">
                    {healthError}
                  </div>
                )}
              </div>

              <div className="diagnostic-item">
                <strong>Request History:</strong>
                {requestHistory.length === 0 ? (
                  <div className="no-requests">No requests yet</div>
                ) : (
                  <div className="request-history">
                    {requestHistory.map((req, idx) => (
                      <div key={idx} className="request-item">
                        <div className="request-line">
                          <span className="request-method">{req.method}</span>
                          <span className="request-endpoint">{req.endpoint}</span>
                          {req.status && <span className="request-status success">✓ {req.status}</span>}
                          {req.error && <span className="request-status error">✗ Error</span>}
                        </div>
                        <div className="request-url">{req.url}</div>
                        {req.error && <div className="request-error">{req.error}</div>}
                        <div className="request-time">{new Date(req.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="two-column-layout">
          <InputPanel
            chapterText={chapterText}
            setChapterText={setChapterText}
            authorName={authorName}
            setAuthorName={setAuthorName}
            platform={platform}
            setPlatform={setPlatform}
            onExtractOutline={handleExtractOutline}
            onGenerateDraft={handleGenerateDraft}
            isExtracting={isExtracting}
            isAssembling={isAssembling}
            hasOutline={!!outline}
            extractElapsed={extractElapsed}
            assembleElapsed={assembleElapsed}
          />

          <OutputPanel
            outline={outline}
            draft={draft}
            extractError={extractError}
            assembleError={assembleError}
            voiceAnalysis={voiceAnalysis}
          />
        </div>
      </div>
    </div>
  );
}

export default ReverseEngineerPage;
