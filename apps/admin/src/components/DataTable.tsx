import type { AdminResource } from '../config/resources';

type Row = Record<string, unknown>;

type Props = {
  resource: AdminResource;
  rows: Row[];
  loading: boolean;
  onSelect: (row: Row) => void;
  onDelete: (row: Row) => void;
};

function cellValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

export function DataTable({ resource, rows, loading, onSelect, onDelete }: Props) {
  if (loading) {
    return <p className="admin-muted">Loading…</p>;
  }

  if (rows.length === 0) {
    return <p className="admin-muted">No records found.</p>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {resource.columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = String(row.id ?? row.requester_id ?? JSON.stringify(row));
            return (
              <tr key={id}>
                {resource.columns.map((col) => (
                  <td key={col.key} className={col.primary ? 'admin-table-primary' : undefined}>
                    {cellValue(row[col.key])}
                  </td>
                ))}
                <td className="admin-table-actions">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onSelect(row)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={() => onDelete(row)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
