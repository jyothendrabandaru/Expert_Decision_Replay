import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, CheckCircle, XCircle, ChevronRight, UserPlus, ShieldCheck, Mail, Building, Briefcase, Sparkles } from 'lucide-react';
import { RoleBadge } from '../../components/ui/StatusBadge';
import api from '../../api/client';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleModal, setRoleModal] = useState({ open: false, user: null, role_code: '' });

  const fetchUsers = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles'),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!roleModal.user || !roleModal.role_code) return;
    try {
      await api.patch(`/users/${roleModal.user.id}/role`, {
        role_code: roleModal.role_code,
      });
      setRoleModal({ open: false, user: null, role_code: '' });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/status`, {
        is_active: !user.is_active,
      });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user status.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.profile?.department?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role?.code === 'administrator').length;
  const managerUsers = users.filter(u => u.role?.code === 'manager').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </span>
            <span>Enterprise User Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage user identities, active status, and RBAC governance roles</p>
        </div>
      </div>

      {/* Colorful Metric Pods */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalUsers}</p>
          <span className="text-[11px] font-semibold text-blue-600 mt-1 block">Provisioned Accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Status</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeUsers}</p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Active Directory</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrators</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{adminUsers}</p>
          <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Superuser Privilege</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Managers & Leads</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{managerUsers}</p>
          <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Approval Authority</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email or department..."
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {filteredUsers.length} Users
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No users match the search filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">User / Identity</th>
                  <th className="py-3.5 px-4">Title & Department</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-1 ring-blue-500/20">
                          {u.profile?.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {u.profile?.full_name || 'No Profile Name'}
                          </span>
                          <span className="text-slate-400 text-[11px]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{u.profile?.job_title || 'Staff Engineer'}</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{u.profile?.department || 'Engineering'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RoleBadge roleCode={u.role?.code} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setRoleModal({ open: true, user: u, role_code: u.role?.code || 'employee' })}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                          u.is_active
                            ? 'text-rose-600 hover:bg-rose-50 bg-white border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 bg-white border-emerald-200'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <form onSubmit={handleUpdateRole} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Assign System Role</h3>
            <p className="text-xs text-slate-500">
              Update authorization privileges for <strong className="text-slate-800">{roleModal.user?.email}</strong>
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select System Role
              </label>
              <select
                value={roleModal.role_code}
                onChange={(e) => setRoleModal({ ...roleModal, role_code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModal({ open: false, user: null, role_code: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
