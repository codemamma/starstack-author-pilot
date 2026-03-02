import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateInputPanel from '../components/CreateInputPanel';
import OutputPanel from '../components/OutputPanel';
import { generateMockOutput } from '../utils/mockGenerator';
import './CreatePostPage.css';

interface OutputData {
  draft: string;
  structure: string;
  voiceScore: number;
  reusedPhrases: string[];
}

function CreatePostPage() {
  const [output, setOutput] = useState<OutputData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (
    chapterText: string,
    authorName: string,
    platform: string,
    engagementGoal: string
  ) => {
    setIsGenerating(true);

    setTimeout(() => {
      const result = generateMockOutput(chapterText, authorName, platform, engagementGoal);
      setOutput(result);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="create-post-page">
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <h1>Create Long-form Post from Chapter</h1>
        </div>
      </header>

      <main className="page-content">
        <div className="two-column-layout">
          <CreateInputPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
          <OutputPanel output={output} />
        </div>
      </main>
    </div>
  );
}

export default CreatePostPage;
