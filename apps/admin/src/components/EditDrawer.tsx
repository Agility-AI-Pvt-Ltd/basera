import { useEffect, useState } from 'react';

import type { AdminResource } from '../config/resources';

type Row = Record<string, unknown>;

type Props = {
  resource: AdminResource;
  row: Row | null;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<string | null>;
};

function rowId(row: Row): string | null {
  if (row.id != null) return String(row.id);
  if (row.requester_id != null && row.recipient_id != null) {
    return `${row.requester_id}:${row.recipient_id}`;
  }
  return null;
}

export function EditDrawer({ resource, row, onClose, onSave }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!row || !resource.editableFields) return;
    const next: Record<string, string> = {};
    for (const field of resource.editableFields) {
      const v = row[field];
      next[field] = v == null ? '' : String(v);
    }
    setForm(next);
    setError(null);
  }, [row, resource.editableFields]);

  if (!row) return null;

  const id = rowId(row);
  if (!id) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    const patch: Record<string, unknown> = {};
    for (const field of resource.editableFields ?? []) {
      const raw = form[field];
      if (raw === 'true' || raw === 'false') {
        patch[field] = raw === 'true';
      } else if (field === 'member_count' && raw !== '') {
        patch[field] = Number(raw);
      } else {
        patch[field] = raw;
      }
    }
    const err = await onSave(id, patch);
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div className="admin-drawer-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}>
        <header className="admin-drawer-header">
          <h2>Edit {resource.label}</h2>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="admin-drawer-body">
          {resource.editableFields?.map((field) => {
            const options =
              resource.statusField === field ? resource.statusOptions : undefined;
            return (
              <label key={field} className="admin-field">
                <span>{field}</span>
                {options ? (
                  <select
                    value={form[field] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field === 'is_admin' || field === 'signup_complete' ? (
                  <select
                    value={form[field] ?? 'false'}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : field === 'description' || field === 'body' || field === 'details' ? (
                  <textarea
                    rows={4}
                    value={form[field] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  />
                )}
              </label>
            );
          })}
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <footer className="admin-drawer-footer">
          <button type="button" className="admin-btn admin-btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
