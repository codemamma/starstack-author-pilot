import './InputPanel.css';

interface InputPanelProps {
  chapterText: string;
  setChapterText: (value: string) => void;
  authorName: string;
  setAuthorName: (value: string) => void;
  platform: string;
  setPlatform: (value: string) => void;
  engagementGoal: string;
  setEngagementGoal: (value: string) => void;
  onReverseEngineer: () => void;
  isProcessing: boolean;
}

function InputPanel({
  chapterText,
  setChapterText,
  authorName,
  setAuthorName,
  platform,
  setPlatform,
  engagementGoal,
  setEngagementGoal,
  onReverseEngineer,
  isProcessing,
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
        <select
          id="platform"
          className="form-select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="LinkedIn">LinkedIn</option>
          <option value="Substack">Substack</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="engagement-goal">Engagement Goal</label>
        <select
          id="engagement-goal"
          className="form-select"
          value={engagementGoal}
          onChange={(e) => setEngagementGoal(e.target.value)}
        >
          <option value="Thought leadership">Thought leadership</option>
          <option value="Speaking">Speaking</option>
          <option value="Lead-gen">Lead-gen</option>
          <option value="Discussion">Discussion</option>
        </select>
      </div>

      <button
        className="primary-button"
        onClick={onReverseEngineer}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Reverse Engineer'}
      </button>

      <p className="privacy-note">Your content stays private in this demo.</p>
    </div>
  );
}

export default InputPanel;
