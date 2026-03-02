import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Content Reverse Engineering Tool</h1>
        <p className="subtitle">Transform your chapter content into engaging social posts</p>

        <div className="features-grid">
          <div className="feature-card">
            <h2>Create Long-form Post from Chapter</h2>
            <p>
              Transform your book chapter or long-form content into an engaging post
              optimized for LinkedIn or Substack. Preserve your voice and key insights.
            </p>
            <Link to="/create-post" className="cta-button">
              Create Post
            </Link>
          </div>

          <div className="feature-card">
            <h2>Reverse Engineer: Chapter → Long-form Post</h2>
            <p>
              Extract the structure, voice, and key insights from your chapter content
              and generate platform-optimized posts with detailed analysis.
            </p>
            <Link to="/reverse-engine" className="cta-button">
              Reverse Engineer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
