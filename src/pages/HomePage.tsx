import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Content Reverse Engineering Tool</h1>
        <p className="subtitle">Transform your chapter content into engaging social posts</p>

        <div className="feature-card">
          <h2>Reverse Engineer: Chapter → Long-form Post</h2>
          <p>
            Extract the structure, voice, and key insights from your chapter content
            and generate platform-optimized posts for LinkedIn and Substack.
          </p>
          <Link to="/reverse-engine" className="cta-button">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
