'use client';

import { useEffect, useState, useRef } from 'react';
import OfficerNav from '@/components/OfficerNav';
import NotificationsTable, { NotificationRow } from '@/components/NotificationsTable';
import { useRole } from '@/lib/useRole';

interface Branch {
  id: number;
  code: string;
  name: string;
}

export default function OfficerNotificationPage() {
  const authorized = useRole('officer');

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notificationNumber, setNotificationNumber] = useState('');
  const [branchId, setBranchId] = useState('');
  const [title, setTitle] = useState('');
  const [vacancies, setVacancies] = useState('');
  const [cutoffDate, setCutoffDate] = useState('');
  const [lastDate, setLastDate] = useState('');

  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minHeightCm, setMinHeightCm] = useState('');
  const [minPercentage, setMinPercentage] = useState('');
  const [unmarriedOnly, setUnmarriedOnly] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/officer/notifications');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load notifications data.');
      }

      setNotifications((data.notifications as NotificationRow[]) ?? []);
      setBranches((data.branches as Branch[]) ?? []);
      if (data.branches && data.branches.length > 0 && !branchId) {
        setBranchId(String(data.branches[0].id));
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authorized) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  if (!authorized) return null;

  function resetForm() {
    setEditingId(null);
    setNotificationNumber('');
    setTitle('');
    setVacancies('');
    setCutoffDate('');
    setLastDate('');
    setMinAge('');
    setMaxAge('');
    setMinHeightCm('');
    setMinPercentage('');
    setUnmarriedOnly(true);
    setFormError(null);
  }

  function handleEditClick(n: NotificationRow) {
    setEditingId(n.id);
    setNotificationNumber(n.notification_number);
    setBranchId(String(n.branch_id));
    setTitle(n.title);
    setVacancies(String(n.vacancies));
    setCutoffDate(n.cutoff_date);
    setLastDate(n.last_date);

    const r = n.eligibility_rules;
    setMinAge(r ? String(r.min_age) : '');
    setMaxAge(r ? String(r.max_age) : '');
    setMinHeightCm(r ? String(r.min_height_cm) : '');
    setMinPercentage(r ? String(r.min_percentage) : '');
    setUnmarriedOnly(r ? r.unmarried_only : true);

    setFormError(null);
    setFormSuccess(null);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!branchId) {
      setFormError('Please select a service branch.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update mode
        const res = await fetch('/api/officer/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: title.trim(),
            vacancies: parseInt(vacancies, 10),
            cutoffDate,
            lastDate,
            minAge,
            maxAge,
            minHeightCm,
            minPercentage,
            unmarriedOnly,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update notification.');
        }

        setFormSuccess('Notification and eligibility rules updated successfully.');
        resetForm();
        loadData();
      } else {
        // Insert mode
        const res = await fetch('/api/officer/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationNumber: notificationNumber.trim(),
            branchId: parseInt(branchId, 10),
            title: title.trim(),
            vacancies: parseInt(vacancies, 10),
            cutoffDate,
            lastDate,
            minAge,
            maxAge,
            minHeightCm,
            minPercentage,
            unmarriedOnly,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create notification.');
        }

        setFormSuccess('New recruitment notification and eligibility rules created successfully.');
        resetForm();
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <OfficerNav />
      <div className="container page">
        <div className="page-header">
          <h1>Commission Notifications Management</h1>
          <p className="page-desc">
            View, draft, publish, and update recruitment entries, vacancy quotas, and eligibility rules.
          </p>
        </div>

        {error && <div className="error mb-16">{error}</div>}

        {/* Section 1: Active Notifications Table */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Active Commission Notifications</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--c-text-muted)' }}>
              Loading active notifications...
            </div>
          ) : (
            <NotificationsTable
              notifications={notifications}
              canEdit={true}
              onEdit={handleEditClick}
            />
          )}
        </div>

        {/* Section 2: Add / Edit Form */}
        <div className="panel panel-accent" ref={formRef}>
          <div className="panel-header">
            <span className="panel-title">
              {editingId ? `Edit Notification Reference (#${editingId})` : 'Publish New Commission Notification'}
            </span>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={resetForm}
              >
                Cancel Edit Mode
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>1. Entry Details</h3>
            <div className="row">
              <div className="col">
                <label htmlFor="notif-number">
                  Notification Number <span className="required-star">*</span>
                </label>
                <input
                  id="notif-number"
                  type="text"
                  required
                  disabled={editingId !== null}
                  placeholder="e.g. NDA-155-2026"
                  value={notificationNumber}
                  onChange={(e) => setNotificationNumber(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="branch-select">
                  Service Branch <span className="required-star">*</span>
                </label>
                <select
                  id="branch-select"
                  disabled={editingId !== null}
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col">
                <label htmlFor="notif-title">
                  Entry / Course Title <span className="required-star">*</span>
                </label>
                <input
                  id="notif-title"
                  type="text"
                  required
                  placeholder="e.g. National Defence Academy Course 155"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: '12px' }}>
              <div className="col">
                <label htmlFor="vacancies">
                  Sanctioned Vacancies <span className="required-star">*</span>
                </label>
                <input
                  id="vacancies"
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 400"
                  value={vacancies}
                  onChange={(e) => setVacancies(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="cutoff-date">
                  Age Cutoff Date <span className="required-star">*</span>
                </label>
                <input
                  id="cutoff-date"
                  type="date"
                  required
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="last-date">
                  Last Date to Apply <span className="required-star">*</span>
                </label>
                <input
                  id="last-date"
                  type="date"
                  required
                  value={lastDate}
                  onChange={(e) => setLastDate(e.target.value)}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '24px', marginBottom: '14px' }}>
              2. Eligibility Rules (Automated Screening Criteria)
            </h3>
            <div className="row">
              <div className="col">
                <label htmlFor="min-age">
                  Min Age (Years) <span className="required-star">*</span>
                </label>
                <input
                  id="min-age"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 16.5"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="max-age">
                  Max Age (Years) <span className="required-star">*</span>
                </label>
                <input
                  id="max-age"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 19.5"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="min-height">
                  Min Height (cm) <span className="required-star">*</span>
                </label>
                <input
                  id="min-height"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 157.0"
                  value={minHeightCm}
                  onChange={(e) => setMinHeightCm(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="min-pct">
                  Min Percentage (%) <span className="required-star">*</span>
                </label>
                <input
                  id="min-pct"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 60.0"
                  value={minPercentage}
                  onChange={(e) => setMinPercentage(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={unmarriedOnly}
                  onChange={(e) => setUnmarriedOnly(e.target.checked)}
                />
                <span>Mandatory Unmarried Status Requirement</span>
              </label>
            </div>

            <div className="mt-24">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? 'Saving Records...'
                  : editingId
                  ? 'Update Notification & Rules'
                  : 'Publish Commission Notification'}
              </button>
            </div>

            {formError && <div className="error mt-16">{formError}</div>}
            {formSuccess && <div className="success mt-16">{formSuccess}</div>}
          </form>
        </div>
      </div>
    </>
  );
}
