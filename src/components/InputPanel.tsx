import './InputPanel.css';

interface InputPanelProps {
  chapterText: string;
  setChapterText: (value: string) => void;
  authorName: string;
  setAuthorName: (value: string) => void;
  platform: string;
  setPlatform: (value: string) => void;
  onExtractOutline: () => void;
  onGenerateDraft: () => void;
  isExtracting: boolean;
  isAssembling: boolean;
  hasOutline: boolean;
  extractElapsed: number;
  assembleElapsed: number;
}

function InputPanel({
  chapterText,
  setChapterText,
  authorName,
  setAuthorName,
  platform,
  setPlatform,
  onExtractOutline,
  onGenerateDraft,
  isExtracting,
  isAssembling,
  hasOutline,
  extractElapsed,
  assembleElapsed,
}: InputPanelProps) {
  return (
    <div className="input-panel">
      <h2>Input</h2>

      <div className="form-group">
        <label htmlFor="chapter-text">
          Chapter Text <span className="required">*</span>
        </label>
        <textarea
          id="chapter-text"
          className="form-textarea"
          placeholder="Paste your chapter content here..."
          value={chapterText}
          onChange={(e) => setChapterText(e.target.value)}
          rows={12}
        />
      </div>

      <div className="form-group">
        <label htmlFor="author-name">Author Name</label>
        <input
          type="text"
          id="author-name"
          className="form-input"
          placeholder="Optional"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="platform">Platform</label>
        <div className="platform-selector">
          <button
            type="button"
            className={`platform-button ${platform === 'LinkedIn' ? 'active' : ''}`}
            onClick={() => setPlatform('LinkedIn')}
          >
            LinkedIn
          </button>
          <button
            type="button"
            className={`platform-button ${platform === 'Substack' ? 'active' : ''}`}
            onClick={() => setPlatform('Substack')}
          >
            Substack
          </button>
        </div>
      </div>

      <div className="workflow-steps">
        <button
          className="step-button"
          onClick={onExtractOutline}
          disabled={isExtracting || isAssembling}
        >
          {isExtracting ? (
            <span className="button-content">
              <span className="spinner"></span>
              Extracting outline... {extractElapsed}s
            </span>
          ) : (
            '1) Extract Outline'
          )}
        </button>

        <button
          className="step-button"
          onClick={onGenerateDraft}
          disabled={!hasOutline || isExtracting || isAssembling}
        >
          {isAssembling ? (
            <span className="button-content">
              <span className="spinner"></span>
              Writing draft... {assembleElapsed}s
            </span>
          ) : (
            '2) Generate Draft'
          )}
        </button>
      </div>

      <p className="privacy-note">Your content stays private in this demo.</p>
    </div>
  );
}

export default InputPanel;
