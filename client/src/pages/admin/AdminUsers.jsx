import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ROLES = ['CITIZEN', 'DEPARTMENT_STAFF', 'ADMIN'];

const ROLE_COLORS = {
  ADMIN: 'bg-red-100 text-red-700',
  DEPARTMENT_STAFF: 'bg-blue-100 text-blue-700',
  CITIZEN: 'bg-gray-100 text-gray-700',
};

function UserRow({ user, departments, onRoleChange }) {
  const [role, setRole] = useState(user.role);
  const [deptId, setDeptId] = useState(user.departmentId || '');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const isDirty = role !== user.role || deptId !== (user.departmentId || '');

  async function save() {
    setSaving(true);
    try {
      await onRoleChange(user._id, role, role === 'DEPARTMENT_STAFF' ? deptId : undefined);
      addToast(`${user.name}'s role updated to ${role}.`, 'success');
    } catch {
      // error toast handled in parent
      setRole(user.role);
      setDeptId(user.departmentId || '');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            if (e.target.value !== 'DEPARTMENT_STAFF') setDeptId('');
          }}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {role === 'DEPARTMENT_STAFF' ? (
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select department --</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        {isDirty && (
          <button
            onClick={save}
            disabled={saving || (role === 'DEPARTMENT_STAFF' && !deptId)}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminUsers() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/departments'),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRoleChange(userId, role, departmentId) {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/role`, { role, departmentId });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, ...data } : u)));
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update role.', 'error');
      throw err;
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Assign roles and departments to registered users</p>
          </div>
          <Link
            to="/admin"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full sm:w-80 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">New Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      departments={departments}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
