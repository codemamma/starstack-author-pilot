import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReverseEngineerPage from './pages/ReverseEngineerPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reverse-engine" element={<ReverseEngineerPage />} />
    </Routes>
  );
}

export default App;
