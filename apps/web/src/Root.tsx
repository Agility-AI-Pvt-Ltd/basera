import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import App from './App';
import { CommunityPage } from './community/CommunityPage';

export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
