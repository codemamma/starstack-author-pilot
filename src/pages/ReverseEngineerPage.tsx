import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputPanel from '../components/InputPanel';
import OutputPanel from '../components/OutputPanel';
import './ReverseEngineerPage.css';
import { extractOutline, assembleDraft } from '../lib/pilotApi';

function ReverseEngineerPage() {
  const [chapterText, setChapterText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [engagementGoal, setEngagementGoal] = useState('Thought leadership');
  const [output, setOutput] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const outline = extractResponse.outline;

      const assembleResponse = await assembleDraft({
        platform: platform.toLowerCase() as "substack" | "linkedin",
        outline,
        source: chapterText,
      });

      setOutput({
        draft: assembleResponse.draft,
        structure: JSON.stringify(outline, null, 2),
        outline,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
