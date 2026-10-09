import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { DataTable } from '../components/DataTable';
import { EditDrawer } from '../components/EditDrawer';
import { ADMIN_RESOURCES, type AdminResource } from '../config/resources';
import { supabase } from '../lib/supabase';

type Row = Record<string, unknown>;

function findResource(resourceId: string | undefined): AdminResource | undefined {
  return ADMIN_RESOURCES.find((r) => r.id === resourceId);
}

export function ResourcePage() {
  const { resourceId } = useParams();
  const resource = findResource(resourceId);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!resource) return;
    setLoading(true);
    setMessage(null);
    let query = supabase.from(resource.table).select('*');
    if (resource.orderBy) {
      query = query.order(resource.orderBy.column, {
        ascending: resource.orderBy.ascending ?? true,
      });
    }
    const { data, error } = await query.limit(500);
    if (error) setMessage(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [resource]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!resource) {
    return (
      <div className="admin-page">
        <p className="admin-error">Unknown resource.</p>
      </div>
    );
  }

  const filtered = search.trim()
    ? rows.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase()),
      )
    : rows;

  const saveRow = async (id: string, patch: Record<string, unknown>) => {
    if (resource.table === 'community_connections') {
      const [requesterId, recipientId] = id.split(':');
      const { error } = await supabase
        .from(resource.table)
        .update(patch)
        .eq('requester_id', requesterId)
        .eq('recipient_id', recipientId);
      if (error) return error.message;
    } else {
      const { error } = await supabase.from(resource.table).update(patch).eq('id', id);
      if (error) return error.message;
    }
    await load();
    return null;
  };

  const deleteRow = async (row: Row) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    if (resource.table === 'community_connections') {
      const { error } = await supabase
        .from(resource.table)
        .delete()
        .eq('requester_id', row.requester_id)
        .eq('recipient_id', row.recipient_id);
      if (error) setMessage(error.message);
    } else if (row.id != null) {
      const { error } = await supabase.from(resource.table).delete().eq('id', String(row.id));
      if (error) setMessage(error.message);
    }
    await load();
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{resource.label}</h1>
        <p className="admin-muted">{resource.description}</p>
      </header>
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search in loaded rows…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="admin-btn admin-btn-ghost" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {message ? <p className="admin-error">{message}</p> : null}
      <DataTable
        resource={resource}
        rows={filtered}
        loading={loading}
        onSelect={setSelected}
        onDelete={(row) => void deleteRow(row)}
      />
      <EditDrawer
        resource={resource}
        row={selected}
        onClose={() => setSelected(null)}
        onSave={saveRow}
      />
    </div>
  );
}
