import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputPanel from '../components/InputPanel';
import OutputPanel from '../components/OutputPanel';
import './ReverseEngineerPage.css';
import { generateMockOutput } from '../utils/mockGenerator';

function ReverseEngineerPage() {
  const [chapterText, setChapterText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [engagementGoal, setEngagementGoal] = useState('Thought leadership');
  const [output, setOutput] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReverseEngineer = () => {
    if (!chapterText.trim()) {
      alert('Please enter chapter text');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const mockOutput = generateMockOutput(chapterText, authorName, platform, engagementGoal);
      setOutput(mockOutput);
      setIsProcessing(false);
    }, 1500);
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

          <OutputPanel output={output} />
        </div>
      </div>
    </div>
  );
}

export default ReverseEngineerPage;
