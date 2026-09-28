import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Calendar, 
  User, 
  Eye, 
  Clock, 
  Activity, 
  LogIn, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Shield, 
  Globe, 
  Sparkles,
  Filter,
  RefreshCw,
  Layers,
  Code
} from 'lucide-react';
import api from '../../api/client';
import { formatLocalDateTime, formatRelativeTime } from '../../utils/date';
import { RoleBadge } from '../../components/ui/StatusBadge';

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;

      const res = await api.get('/audit', { params });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const actor = (l.actor_name || l.actor_email || '').toLowerCase();
    const action = (l.action || '').toLowerCase();
    const entity = (l.entity_type || '').toLowerCase();
    const ip = (l.ip_address || '').toLowerCase();
    const extraStr = l.extra ? JSON.stringify(l.extra).toLowerCase() : '';
    return actor.includes(s) || action.includes(s) || entity.includes(s) || ip.includes(s) || extraStr.includes(s);
  });

  // Calculate metrics
  const totalLogs = logs.length;
  const loginEvents = logs.filter(l => l.action?.toLowerCase().includes('login')).length;
  const decisionEvents = logs.filter(l => l.action?.toLowerCase().includes('decision') || l.entity_type === 'decision').length;
  const governanceEvents = logs.filter(l => l.action?.toLowerCase().includes('role') || l.action?.toLowerCase().includes('approv')).length;

  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('login_success') || act === 'login') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
          <span>LOGIN SUCCESS</span>
        </span>
      );
    }
    if (act.includes('login_failed')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>LOGIN FAILED</span>
        </span>
      );
    }
    if (act.includes('create')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span className="uppercase">{action}</span>
        </span>
      );
    }
    if (act.includes('approve')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
          <span className="uppercase">{action}</span>
        </span>
      );
    }
    if (act.includes('reject')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span className="uppercase">{action}</span>
        </span>
      );
    }
    if (act.includes('change') || act.includes('request')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span className="uppercase">{action}</span>
        </span>
      );
    }
    if (act.includes('submit')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <Send className="w-3.5 h-3.5 text-sky-600" />
          <span className="uppercase">{action}</span>
        </span>
      );
    }
    if (act.includes('role')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
          <Shield className="w-3.5 h-3.5 text-violet-600" />
          <span className="uppercase">{action}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
        <Activity className="w-3.5 h-3.5 text-blue-600" />
        <span className="uppercase">{action}</span>
      </span>
    );
  };

  const getEntityBadge = (entityType, entityId) => {
    const type = (entityType || '').toLowerCase();
    const shortId = entityId ? String(entityId).slice(0, 8) : '';
    
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (type === 'decision') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (type === 'user') colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (type === 'team') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (type === 'approval') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';

    return (
      <div className="flex items-center gap-1.5">
        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${colorClass}`}>
          {entityType}
        </span>
        {shortId && (
          <span className="font-mono text-[10px] text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded">
            {shortId}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-md shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span>Compliance & Security Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident, immutable records of all user actions, state transitions, and modifications in real-time
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Colorful KPI Pods */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Audit Events</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalLogs}</p>
          <span className="text-[11px] font-semibold text-blue-600 mt-1 block">Immutable Ledger Records</span>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auth & Logins</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{loginEvents}</p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Security Access Logs</span>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Decision Records</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{decisionEvents}</p>
          <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">ADR Architecture Changes</span>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Governance Actions</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{governanceEvents}</p>
          <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Approvals & Permissions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, IP, payload..."
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Action Types</option>
          <option value="login_success">Login Success</option>
          <option value="create_decision">Create Decision</option>
          <option value="update_decision">Update Decision</option>
          <option value="submit_for_review">Submit for Review</option>
          <option value="approve_decision_step">Approve Step</option>
          <option value="reject_decision">Reject Decision</option>
          <option value="request_decision_changes">Request Changes</option>
          <option value="record_outcome">Record Outcome</option>
          <option value="assign_user_role">Assign Role</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Entity Types</option>
          <option value="decision">Decision</option>
          <option value="alternative">Alternative</option>
          <option value="criterion">Criterion</option>
          <option value="approval">Approval</option>
          <option value="user">User</option>
          <option value="team">Team</option>
        </select>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 ml-auto">
          {filteredLogs.length} Records
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Loading audit events...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No audit records match the selected search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Timestamp (Local Time)</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-5 text-right">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-indigo-50/30 transition-colors">
                    {/* Timestamp with real local time + relative time */}
                    <td className="py-3 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block font-mono text-[11.5px]">
                            {formatLocalDateTime(l.created_at)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              {formatRelativeTime(l.created_at)}
                            </span>
                            <span className="text-[10px] text-slate-400">Local</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Actor with avatar & details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
                          {(l.actor_name || l.actor_email || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {l.actor_name || l.actor_email || 'System Agent'}
                          </span>
                          {l.actor_name && l.actor_email && (
                            <span className="text-slate-400 text-[10px] block">{l.actor_email}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Action with colorful badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(l.action)}
                    </td>

                    {/* Target Entity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getEntityBadge(l.entity_type, l.entity_id)}
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{l.ip_address || '127.0.0.1'}</span>
                      </div>
                    </td>

                    {/* Metadata Payload with interactive inspect */}
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      {l.extra && Object.keys(l.extra).length > 0 ? (
                        <button
                          onClick={() => setInspectLog(l)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer"
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {l.extra.role ? `role: "${l.extra.role}"` : 'Inspect Payload'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Metadata Payload Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Audit Payload Details</h3>
                  <p className="text-[11px] text-slate-400">Event ID: {inspectLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actor</span>
                  <span className="font-bold text-slate-900">{inspectLog.actor_name || inspectLog.actor_email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                  <span className="font-bold text-slate-900">{formatLocalDateTime(inspectLog.created_at)}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Extra JSON Payload
                </label>
                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(inspectLog.extra, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectLog(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
