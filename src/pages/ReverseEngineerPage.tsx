import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputPanel from '../components/InputPanel';
import OutputPanel from '../components/OutputPanel';
import './ReverseEngineerPage.css';
import { extractOutline, assembleDraft, checkHealth, getApiBaseUrl, type HealthCheckResponse } from '../lib/pilotApi';

interface RequestDebugInfo {
  endpoint: string;
  method: string;
  url: string;
  status?: number;
  error?: string;
  timestamp: string;
}

function ReverseEngineerPage() {
  const [chapterText, setChapterText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [engagementGoal, setEngagementGoal] = useState('Thought leadership');
  const [output, setOutput] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [requestHistory, setRequestHistory] = useState<RequestDebugInfo[]>([]);

  const logRequest = (info: RequestDebugInfo) => {
    setRequestHistory(prev => [info, ...prev.slice(0, 4)]);
  };

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    setHealthError(null);
    setHealthStatus(null);

    try {
      const health = await checkHealth();
      setHealthStatus(health);
      logRequest({
        endpoint: '/health',
        method: 'GET',
        url: `${getApiBaseUrl()}/health`,
        status: 200,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Health check failed';
      setHealthError(errorMsg);
      logRequest({
        endpoint: '/health',
        method: 'GET',
        url: `${getApiBaseUrl()}/health`,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleReverseEngineer = async () => {
    if (!chapterText.trim()) {
      alert('Please enter chapter text');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOutput(null);

    try {
      const extractResponse = await extractOutline({
        source: chapterText,
        author: authorName || undefined,
      });

      logRequest({
        endpoint: '/extract',
        method: 'POST',
        url: `${getApiBaseUrl()}/extract`,
        status: 200,
        timestamp: new Date().toISOString(),
      });

      const outline = extractResponse.outline;

      const assembleResponse = await assembleDraft({
        platform: platform.toLowerCase() as "substack" | "linkedin",
        outline,
        source: chapterText,
      });

      logRequest({
        endpoint: '/assemble',
        method: 'POST',
        url: `${getApiBaseUrl()}/assemble`,
        status: 200,
        timestamp: new Date().toISOString(),
      });

      setOutput({
        draft: assembleResponse.draft,
        structure: JSON.stringify(outline, null, 2),
        outline,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);

      const failedEndpoint = errorMsg.toLowerCase().includes('extract') ? '/extract' : '/assemble';
      logRequest({
        endpoint: failedEndpoint,
        method: 'POST',
        url: `${getApiBaseUrl()}${failedEndpoint}`,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
            engagementGoal={engagementGoal}
            setEngagementGoal={setEngagementGoal}
            onReverseEngineer={handleReverseEngineer}
            isProcessing={isProcessing}
          />

          <OutputPanel output={output} error={error} />
        </div>
      </div>
    </div>
  );
}

export default ReverseEngineerPage;
