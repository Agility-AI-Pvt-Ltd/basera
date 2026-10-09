import { NavLink, Outlet } from 'react-router-dom';

import { ADMIN_RESOURCES } from '../config/resources';
import { useAuth } from '../context/AuthContext';

export function AdminLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">B</span>
          <div>
            <strong>Basera</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Dashboard
          </NavLink>
          {ADMIN_RESOURCES.map((r) => (
            <NavLink key={r.id} to={r.path} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {r.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <p className="admin-user-email">{user?.email ?? user?.id}</p>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
