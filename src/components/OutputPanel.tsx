import { useState, useEffect } from 'react';
import './OutputPanel.css';

interface OutputPanelProps {
  output: any;
  error?: string | null;
}

type TabType = 'draft' | 'structure' | 'voice';

function OutputPanel({ output, error }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('draft');

  useEffect(() => {
    if (output) {
      setActiveTab('draft');
    }
  }, [output]);

  if (error) {
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
          <p style={{ color: '#e53e3e' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!output) {
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
          <p>Enter chapter text and click "Reverse Engineer" to generate output</p>
        </div>
      </div>
    );
  }

  return (
    <div className="output-panel">
      <h2>Output</h2>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          Draft
        </button>
        <button
          className={`tab ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          Structure JSON
        </button>
        <button
          className={`tab ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          Voice Reuse
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'draft' && (
          <div className="draft-content">
            <div className="content-wrapper">
              {output.draft}
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="structure-content">
            <pre className="json-output">{output.structure}</pre>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="voice-content">
            <div className="voice-metric">
              <div className="metric-label">Voice Consistency Score</div>
              <div className="metric-value">{output.voiceScore}%</div>
            </div>

            <div className="reused-phrases-section">
              <h3>Reused Phrases</h3>
              <div className="phrases-list">
                {output.reusedPhrases.map((phrase: string, index: number) => (
                  <div key={index} className="phrase-item">
                    <span className="phrase-icon">→</span>
                    {phrase}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;
