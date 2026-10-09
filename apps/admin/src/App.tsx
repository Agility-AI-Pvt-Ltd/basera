import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AdminLayout } from './components/AdminLayout';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ResourcePage } from './pages/ResourcePage';

function Protected({ children }: { children: ReactNode }) {
  const { loading, isAdmin, session } = useAuth();
  if (loading) {
    return (
      <div className="admin-login">
        <p className="admin-muted">Loading session…</p>
      </div>
    );
  }
  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <AdminLayout />
          </Protected>
        }>
        <Route index element={<DashboardPage />} />
        <Route path="/resource/:resourceId" element={<ResourcePage />} />
        <Route path="/users" element={<Navigate to="/resource/profiles" replace />} />
        <Route path="/pets" element={<Navigate to="/resource/pets" replace />} />
        <Route path="/adoption/listings" element={<Navigate to="/resource/adoption_listings" replace />} />
        <Route
          path="/adoption/applications"
          element={<Navigate to="/resource/adoption_applications" replace />}
        />
        <Route path="/adoption/reports" element={<Navigate to="/resource/adoption_reports" replace />} />
        <Route path="/community/packs" element={<Navigate to="/resource/community_packs" replace />} />
        <Route path="/community/meetups" element={<Navigate to="/resource/community_meetups" replace />} />
        <Route path="/community/feed" element={<Navigate to="/resource/global_posts" replace />} />
        <Route path="/community/reports" element={<Navigate to="/resource/global_post_reports" replace />} />
        <Route path="/community/posts" element={<Navigate to="/resource/pack_posts" replace />} />
        <Route
          path="/community/connections"
          element={<Navigate to="/resource/community_connections" replace />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
