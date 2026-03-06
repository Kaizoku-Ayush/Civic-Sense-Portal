import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/StatusBadge';
import api from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';

const STATUSES = ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE'];
const CATEGORIES = ['pothole', 'road_damage', 'garbage', 'other'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ── Analytics stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green:  'bg-green-50  text-green-700  border-green-200',
    red:    'bg-red-50    text-red-700    border-red-200',
    gray:   'bg-gray-50   text-gray-700   border-gray-200',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}

// ── Inline row editor ────────────────────────────────────────────────────────
function IssueRow({ issue, departments, onUpdate, selected, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(issue.status);
  const [deptId, setDeptId] = useState(issue.assignedDepartment?._id || '');
  const [priority, setPriority] = useState(issue.priority);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onUpdate(issue._id, { status, assignedDepartment: deptId || null, priority });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-3 py-3 text-xs text-gray-500 font-mono">
        <Link to={`/issues/${issue._id}`} className="hover:text-indigo-600">
          {issue._id.slice(-6).toUpperCase()}
        </Link>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {issue.imageUrl && (
            <img
              src={issue.imageUrl}
              alt=""
              className="h-8 w-8 rounded object-cover flex-shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {issue.title || issue.description?.slice(0, 40) || '(no title)'}
            </p>
            <p className="text-xs text-gray-400">{issue.userId?.name}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><CategoryBadge category={issue.category} /></td>
      <td className="px-3 py-3">
        {editing ? (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <StatusBadge status={issue.status} />
        )}
      </td>
      <td className="px-3 py-3">
        {editing ? (
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        ) : (
          <PriorityBadge priority={issue.priority} />
        )}
      </td>
      <td className="px-3 py-3">
        {editing ? (
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="text-xs border border-gray-300 rounded px-1.5 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Unassigned</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-gray-700">
            {issue.assignedDepartment?.name || <span className="text-gray-400 italic">—</span>}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-xs text-gray-500">
        {new Date(issue.createdAt).toLocaleDateString()}
      </td>
      <td className="px-3 py-3 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setStatus(issue.status);
                setDeptId(issue.assignedDepartment?._id || '');
                setPriority(issue.priority);
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Bulk selection
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkDept, setBulkDept] = useState('');

  const socketRef = useRef(null);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch issues ───────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterDept) params.departmentId = filterDept;

      const { data } = await api.get('/admin/issues', { params });
      setIssues(data.issues);
      setTotal(data.total);
      setPages(data.pages);
      setPage(pg);
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterDept]);

  // ── Fetch departments for dropdowns ───────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Departments fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDepartments();
  }, [fetchStats, fetchDepartments]);

  useEffect(() => {
    fetchIssues(1);
  }, [fetchIssues]);

  // ── Socket.io real-time updates ────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('issue:updated', () => {
      fetchIssues(page);
      fetchStats();
    });

    socket.on('issues:bulk-updated', () => {
      fetchIssues(page);
      fetchStats();
    });

    return () => {
      socket.off('issue:updated');
      socket.off('issues:bulk-updated');
    };
  }, [page, fetchIssues, fetchStats]);

  // ── Issue update handler ───────────────────────────────────────────────────
  async function handleUpdate(id, updates) {
    try {
      await api.patch(`/admin/issues/${id}`, updates);
      await Promise.all([fetchIssues(page), fetchStats()]);
      addToast('Issue updated successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update issue.', 'error');
      throw err;
    }
  }

  // ── Bulk update ────────────────────────────────────────────
  async function handleBulkUpdate() {
    if (selected.size === 0 || (!bulkStatus && !bulkDept)) return;
    const payload = { ids: [...selected] };
    if (bulkStatus) payload.status = bulkStatus;
    if (bulkDept) payload.assignedDepartment = bulkDept;
    try {
      await api.post('/admin/issues/bulk', payload);
      addToast(`${selected.size} issue(s) updated.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Bulk update failed.', 'error');
    }
    setBulkStatus('');
    setBulkDept('');
    await Promise.all([fetchIssues(page), fetchStats()]);
  }

  // ── Toggle selection ───────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === issues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(issues.map((i) => i._id)));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and resolve civic issues</p>
          </div>
          <a
            href="/admin/users"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Manage Users →
          </a>
        </div>

        {/* Analytics Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Issues" value={stats?.total} color="indigo" />
            <StatCard label="Pending" value={stats?.pending} color="yellow" />
            <StatCard label="In Progress" value={stats?.inProgress} color="purple" />
            <StatCard label="Resolved" value={stats?.resolved} color="green" />
            <StatCard label="Rejected" value={stats?.rejected} color="red" />
            <StatCard
              label="Avg Severity"
              value={stats?.avgSeverity != null ? (stats.avgSeverity * 100).toFixed(0) + '%' : '—'}
              color="gray"
              sub="across all issues"
            />
          </div>
        )}

        {/* Category breakdown */}
        {stats?.byCategory && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
                <CategoryBadge category={cat} />
                <span className="text-sm font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterDept(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline ml-auto self-end"
          >
            Clear filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-indigo-700">{selected.size} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="text-sm border border-indigo-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Set status…</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={bulkDept}
              onChange={(e) => setBulkDept(e.target.value)}
              className="text-sm border border-indigo-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Assign dept…</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus && !bulkDept}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
            >
              Apply to {selected.size}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-indigo-500 hover:text-indigo-700 underline"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Issues Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
              Loading issues…
            </div>
          ) : issues.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No issues match the current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === issues.length && issues.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {issues.map((issue) => (
                    <IssueRow
                      key={issue._id}
                      issue={issue}
                      departments={departments}
                      onUpdate={handleUpdate}
                      selected={selected.has(issue._id)}
                      onToggle={() => toggleSelect(issue._id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">{total} total issues</span>
              <div className="flex gap-1">
                <button
                  onClick={() => fetchIssues(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40"
                >
                  ‹ Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">
                  {page} / {pages}
                </span>
                <button
                  onClick={() => fetchIssues(page + 1)}
                  disabled={page >= pages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
