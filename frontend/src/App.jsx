import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DesignerPage from './pages/DesignerPage';

function App() {
  return (
    <Router>
      <div className="h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<DesignerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;