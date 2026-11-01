'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, envConfigured } from '@/lib/supabase';
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
    if (!envConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [notifRes, branchRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*, branches(name), eligibility_rules(*)')
        .order('id', { ascending: true }),
      supabase.from('branches').select('id, code, name').order('id'),
    ]);

    if (notifRes.error) {
      setError(notifRes.error.message);
    } else {
      setNotifications((notifRes.data as unknown as NotificationRow[]) ?? []);
    }

    if (branchRes.data) {
      setBranches(branchRes.data);
      if (branchRes.data.length > 0 && !branchId) {
        setBranchId(String(branchRes.data[0].id));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    if (authorized) {
      loadData();
    }
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

    // Scroll to form
    if (formRef.current) {
      formRef.current.scrollIntoView();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!branchId) {
      setFormError('Please select a branch.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update mode
        const { error: notifErr } = await supabase
          .from('notifications')
          .update({
            title: title.trim(),
            vacancies: parseInt(vacancies, 10),
            cutoff_date: cutoffDate,
            last_date: lastDate,
          })
          .eq('id', editingId);

        if (notifErr) throw notifErr;

        const { error: ruleErr } = await supabase
          .from('eligibility_rules')
          .upsert({
            notification_id: editingId,
            min_age: parseFloat(minAge),
            max_age: parseFloat(maxAge),
            min_height_cm: parseFloat(minHeightCm),
            min_percentage: parseFloat(minPercentage),
            unmarried_only: unmarriedOnly,
          });

        if (ruleErr) throw ruleErr;

        setFormSuccess('Notification updated successfully.');
        resetForm();
        loadData();
      } else {
        // Insert mode
        const { data: notifData, error: notifErr } = await supabase
          .from('notifications')
          .insert({
            notification_number: notificationNumber.trim(),
            branch_id: parseInt(branchId, 10),
            title: title.trim(),
            vacancies: parseInt(vacancies, 10),
            cutoff_date: cutoffDate,
            last_date: lastDate,
          })
          .select('id')
          .single();

        if (notifErr) throw notifErr;
        const newId = notifData.id;

        const { error: ruleErr } = await supabase
          .from('eligibility_rules')
          .insert({
            notification_id: newId,
            min_age: parseFloat(minAge),
            max_age: parseFloat(maxAge),
            min_height_cm: parseFloat(minHeightCm),
            min_percentage: parseFloat(minPercentage),
            unmarried_only: unmarriedOnly,
          });

        if (ruleErr) throw ruleErr;

        setFormSuccess('Notification and eligibility rules created successfully.');
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
        <h1>Notifications Management</h1>
        <p className="page-desc">View, create, and update recruitment notifications and eligibility rules.</p>

        {!envConfigured && (
          <p className="error">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to use this application.
          </p>
        )}

        <div className="section">
          <h2>Active notifications</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <NotificationsTable
              notifications={notifications}
              canEdit={true}
              onEdit={handleEditClick}
            />
          )}
        </div>

        <div className="section" ref={formRef}>
          <h2>{editingId ? `Edit notification (#${editingId})` : 'Add notification'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col">
                <label htmlFor="notif-number">Notification number</label>
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
                <label htmlFor="branch-select">Branch</label>
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
                <label htmlFor="notif-title">Title</label>
                <input
                  id="notif-title"
                  type="text"
                  required
                  placeholder="Course or Entry Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="row">
              <div className="col">
                <label htmlFor="vacancies">Vacancies</label>
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
                <label htmlFor="cutoff-date">Cutoff date (for age)</label>
                <input
                  id="cutoff-date"
                  type="date"
                  required
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="last-date">Last date to apply</label>
                <input
                  id="last-date"
                  type="date"
                  required
                  value={lastDate}
                  onChange={(e) => setLastDate(e.target.value)}
                />
              </div>
            </div>

            <h3 className="mt-16">Eligibility criteria</h3>
            <div className="row">
              <div className="col">
                <label htmlFor="min-age">Min age (years)</label>
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
                <label htmlFor="max-age">Max age (years)</label>
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
                <label htmlFor="min-height">Min height (cm)</label>
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
                <label htmlFor="min-pct">Min percentage (%)</label>
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

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={unmarriedOnly}
                  onChange={(e) => setUnmarriedOnly(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Unmarried candidates only</span>
              </label>
            </div>

            <div className="mt-16" style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update notification' : 'Add notification'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>

            {formError && <p className="error mt-8">{formError}</p>}
            {formSuccess && <p className="success mt-8">{formSuccess}</p>}
          </form>
        </div>
      </div>
    </>
  );
}

