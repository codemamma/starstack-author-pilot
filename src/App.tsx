import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReverseEngineerPage from './pages/ReverseEngineerPage';
import CreatePostPage from './pages/CreatePostPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reverse-engine" element={<ReverseEngineerPage />} />
      <Route path="/create-post" element={<CreatePostPage />} />
    </Routes>
  );
}

export default App;
