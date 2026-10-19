import { ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CommunityFab() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        alignItems: 'flex-end',
      }}
    >
      <Link
        to="/tag"
        className="community-fab"
        style={{ background: '#4C1D95' }}
        aria-label="Collar Tag Lookup"
      >
        <ShieldCheck size={20} strokeWidth={2.25} aria-hidden />
        <span>Collar Tag</span>
      </Link>
      <Link to="/community" className="community-fab" aria-label="Open community">
        <Users size={22} strokeWidth={2.25} aria-hidden />
        <span>Community</span>
      </Link>
    </div>
  );
}
