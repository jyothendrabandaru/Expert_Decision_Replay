import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, CheckCircle2, ChevronRight, Sparkles, FolderKanban } from 'lucide-react';
import { DecisionStatusBadge } from '../components/ui/StatusBadge';
import { formatLocalDate } from '../utils/date';
import api from '../api/client';

export const ApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const res = await api.get('/approvals/pending');
        setApprovals(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error loading pending approvals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <span>Executive Approvals Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Decisions that have passed technical review and require executive management sign-off
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Loading approvals queue...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="py-16 text-center px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">All sign-offs completed!</h3>
            <p className="text-xs text-slate-400 mt-1">There are no decisions pending executive authorization at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Decision Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Lead Author</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((d) => (
                  <tr key={d.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-4 px-6 min-w-[280px]">
                      <Link to={`/decisions/${d.id}`} className="font-bold text-slate-900 hover:text-indigo-600 text-xs">
                        {d.title}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-indigo-600">
                      {d.category?.name || 'General'}
                    </td>
                    <td className="py-4 px-4">
                      <DecisionStatusBadge status={d.status} approvalRole={d.current_approval_role} approvalStep={d.current_approval_step} />
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-700">
                      {d.owner_name || d.owner_email}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-500">
                      {formatLocalDate(d.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/decisions/${d.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      >
                        <span>Authorize</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
