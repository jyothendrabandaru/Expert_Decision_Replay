import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RotateCcw, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
  Check,
  Building
} from 'lucide-react';
import { DecisionStatusBadge, RoleBadge } from '../../../components/ui/StatusBadge';
import { formatLocalDateTime } from '../../../utils/date';

export const ApprovalsTab = ({ approvals, decision }) => {
  const steps = approvals?.steps || [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Governance & Multi-Tier Verification Workflow</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Architecture Decision Approval Pipeline</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Formal four-stage sign-off pipeline ensuring rigorous peer review, management authorization, and final executive governance before implementation rollout.
        </p>
      </div>

      {/* 4-Stage Stepper Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Workflow Progression ({steps.filter(s => s.status === 'approved').length} of {steps.length || 4} Completed)
        </h3>

        {/* Visual Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((st, idx) => {
            const isApproved = st.status === 'approved';
            const isPending = st.status === 'pending';
            const isRejected = st.status === 'rejected';

            let pillBg = 'bg-slate-50 border-slate-200 text-slate-600';
            let iconColor = 'text-slate-400';
            if (isApproved) {
              pillBg = 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400/20';
              iconColor = 'text-emerald-600';
            } else if (isPending) {
              pillBg = 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-400/30';
              iconColor = 'text-blue-600';
            } else if (isRejected) {
              pillBg = 'bg-rose-50 border-rose-300 text-rose-900';
              iconColor = 'text-rose-600';
            }

            return (
              <div key={st.id || idx} className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${pillBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    Stage {st.step_order || idx + 1}
                  </span>
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isPending ? (
                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>

                <div className="mt-2">
                  <h4 className="text-xs font-bold leading-snug">{st.step_name}</h4>
                  <span className="text-[10px] font-semibold opacity-75 uppercase block mt-0.5">
                    {st.required_role_code}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Stages Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Detailed Governance Audit & Sign-off Trail
        </h3>

        <div className="space-y-6 pt-2">
          {steps.map((st, idx) => {
            const isApproved = st.status === 'approved';
            const isPending = st.status === 'pending';
            const isRejected = st.status === 'rejected';

            return (
              <div key={st.id || idx} className="relative pl-8 pb-6 last:pb-0 border-l-2 border-slate-200 last:border-transparent">
                {/* Step Order Badge */}
                <div
                  className={`absolute -left-4 top-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-xs transition-all ${
                    isApproved
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : isPending
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-blue-500/20 animate-pulse'
                      : isRejected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isApproved ? <Check className="w-4 h-4 stroke-[3]" /> : (st.step_order || idx + 1)}
                </div>

                <div className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/20 border-emerald-200'
                    : isPending
                    ? 'bg-blue-50/25 border-blue-200 shadow-xs'
                    : isRejected
                    ? 'bg-rose-50/30 border-rose-200'
                    : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Stage {st.step_order || idx + 1}
                        </span>
                        <RoleBadge roleCode={st.required_role_code} />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{st.step_name}</h4>
                    </div>
                    <DecisionStatusBadge status={st.status} />
                  </div>

                  <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      {st.actor_name ? (
                        <span>
                          Signed off by: <strong className="text-slate-900 font-semibold">{st.actor_name}</strong>
                          {st.acted_at && (
                            <span className="text-slate-400 ml-1.5 font-mono">• {formatLocalDateTime(st.acted_at)}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          {isPending ? 'Awaiting sign-off from authorized role' : 'Pending prior stages'}
                        </span>
                      )}
                    </div>

                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified & Stamped</span>
                      </span>
                    )}
                  </div>

                  {st.comment && (
                    <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-xs italic text-slate-700 shadow-2xs">
                      "{st.comment}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
