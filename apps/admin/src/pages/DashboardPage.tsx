import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { DASHBOARD_METRICS, ADMIN_RESOURCES } from '../config/resources';
import { supabase } from '../lib/supabase';

type Metric = { label: string; count: number; path: string };

export function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const results = await Promise.all(
        DASHBOARD_METRICS.map(async (m) => {
          const resource = ADMIN_RESOURCES.find((r) => r.table === m.table);
          const { count, error } = await supabase
            .from(m.table)
            .select('*', { count: 'exact', head: true });
          return {
            label: m.label,
            count: error ? 0 : (count ?? 0),
            path: resource?.path ?? '/',
          };
        }),
      );
      if (!cancelled) {
        setMetrics(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p className="admin-muted">Overview of application data in Supabase.</p>
      </header>
      {loading ? (
        <p className="admin-muted">Loading metrics…</p>
      ) : (
        <div className="admin-metrics">
          {metrics.map((m) => (
            <Link key={m.label} to={m.path} className="admin-metric-card">
              <span className="admin-metric-value">{m.count.toLocaleString()}</span>
              <span className="admin-metric-label">{m.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
