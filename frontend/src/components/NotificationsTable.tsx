'use client';

export interface NotificationRow {
  id: number;
  notification_number: string;
  branch_id: number;
  title: string;
  vacancies: number;
  cutoff_date?: string;  // BUG-19 FIX: marked optional since it's not displayed in the table
  last_date: string;
  branches?: { name: string } | null;
  eligibility_rules?: {
    min_age: number;
    max_age: number;
    min_height_cm: number;
    min_percentage: number;
    unmarried_only: boolean;
  } | null;
}

interface NotificationsTableProps {
  notifications: NotificationRow[];
  canEdit?: boolean;
  onEdit?: (notif: NotificationRow) => void;
}

export default function NotificationsTable({
  notifications,
  canEdit = false,
  onEdit,
}: NotificationsTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Notification No.</th>
            <th>Service Branch</th>
            <th>Entry / Course Title</th>
            <th>Vacancies</th>
            <th>Last Date</th>
            <th>Age Limit</th>
            <th>Min Height</th>
            <th>Min %</th>
            <th>Marital Status</th>
            {canEdit && <th style={{ textAlign: 'center' }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {notifications.length === 0 ? (
            <tr>
              <td colSpan={canEdit ? 10 : 9} style={{ textAlign: 'center', padding: '24px', color: 'var(--c-text-muted)' }}>
                No active recruitment notifications found in the database.
              </td>
            </tr>
          ) : (
            notifications.map((n) => {
              const r = n.eligibility_rules;
              return (
                <tr key={n.id}>
                  <td>
                    <strong>{n.notification_number}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{n.branches?.name ?? '-'}</span>
                  </td>
                  <td>{n.title}</td>
                  <td>
                    <span className="status-pill status-selected">
                      {n.vacancies}
                    </span>
                  </td>
                  <td>{n.last_date}</td>
                  <td>{r ? `${r.min_age} - ${r.max_age} yrs` : '-'}</td>
                  <td>{r ? `${r.min_height_cm} cm` : '-'}</td>
                  <td>{r ? `${r.min_percentage}%` : '-'}</td>
                  <td>
                    {r ? (
                      r.unmarried_only ? (
                        <span className="status-pill status-pending">Unmarried</span>
                      ) : (
                        <span>Any</span>
                      )
                    ) : (
                      '-'
                    )}
                  </td>
                  {canEdit && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit && onEdit(n)}
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
