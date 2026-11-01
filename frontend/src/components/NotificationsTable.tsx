'use client';

export interface NotificationRow {
  id: number;
  notification_number: string;
  branch_id: number;
  title: string;
  vacancies: number;
  cutoff_date: string;
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
            <th>Number</th>
            <th>Branch</th>
            <th>Title</th>
            <th>Vacancies</th>
            <th>Cutoff date</th>
            <th>Last date</th>
            <th>Age range</th>
            <th>Min height</th>
            <th>Min %</th>
            <th>Unmarried only</th>
            {canEdit && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {notifications.length === 0 ? (
            <tr>
              <td colSpan={canEdit ? 11 : 10}>No records.</td>
            </tr>
          ) : (
            notifications.map((n) => {
              const r = n.eligibility_rules;
              return (
                <tr key={n.id}>
                  <td>{n.notification_number}</td>
                  <td>{n.branches?.name ?? '-'}</td>
                  <td>{n.title}</td>
                  <td>{n.vacancies}</td>
                  <td>{n.cutoff_date}</td>
                  <td>{n.last_date}</td>
                  <td>{r ? `${r.min_age} - ${r.max_age} yrs` : '-'}</td>
                  <td>{r ? `${r.min_height_cm} cm` : '-'}</td>
                  <td>{r ? `${r.min_percentage}%` : '-'}</td>
                  <td>{r ? (r.unmarried_only ? 'Yes' : 'No') : '-'}</td>
                  {canEdit && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '12px' }}
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

