import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import App from './App';
import { CommunityPage } from './community/CommunityPage';
import { ActivityPage } from './pages/ActivityPage';
import { CollarTagPage } from './pages/CollarTagPage';

export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/t/:tagCode?" element={<CollarTagPage />} />
        <Route path="/tag" element={<CollarTagPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
