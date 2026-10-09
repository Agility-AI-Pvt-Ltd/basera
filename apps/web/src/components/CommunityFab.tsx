import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CommunityFab() {
  return (
    <Link to="/community" className="community-fab" aria-label="Open community">
      <Users size={22} strokeWidth={2.25} aria-hidden />
      <span>Community</span>
    </Link>
  );
}
