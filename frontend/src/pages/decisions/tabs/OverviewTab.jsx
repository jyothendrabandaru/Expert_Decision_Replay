import React from 'react';
import { 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Users, 
  Tag, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCheck
} from 'lucide-react';
import { RoleBadge, DecisionStatusBadge } from '../../../components/ui/StatusBadge';
import { formatLocalDateTime } from '../../../utils/date';

export const OverviewTab = ({ decision, approvals, setActiveTab }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left 2/3 Main ADR Overview */}
      <div className="lg:col-span-2 space-y-6">
        {/* Draft Notice Banner */}
        {decision.status === 'draft' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 flex items-start gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5 shadow-sm">
              1
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Decision Case in Draft Preparation</h4>
              <p className="text-slate-600 leading-relaxed">
                This architecture decision record is currently in draft. Once alternative solutions and evaluation criteria are configured, click <strong>"Submit for Review"</strong> in the top-right toolbar to trigger the formal peer review and management sign-off workflow.
              </p>
            </div>
          </div>
        )}

        {/* Problem Statement & Strategic Context */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Problem Statement & Strategic Context</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Architecture Need</span>
          </div>

          <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100 font-normal">
            {decision.problem_statement || 'No problem statement recorded.'}
          </div>
        </div>

        {/* Selected Decision Outcome & Resolution */}
        {decision.outcome_summary && (
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Final Decision Outcome & Strategic Resolution
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                Authorized Resolution
              </span>
            </div>

            <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-white/90 p-4 rounded-xl border border-emerald-100 shadow-2xs">
              {decision.outcome_summary}
            </div>

            {decision.outcome_recorded_at && (
              <div className="text-[11px] text-emerald-700 pt-1 font-medium flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recorded on: {formatLocalDateTime(decision.outcome_recorded_at)}</span>
              </div>
            )}
          </div>
        )}

        {/* Evaluated Alternatives Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Evaluated Candidate Alternatives ({decision.alternatives?.length || 0})</span>
            </h3>
            <button
              onClick={() => setActiveTab('alternatives')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Explore Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {decision.alternatives?.map((alt) => {
              const isSel = alt.is_selected || alt.id === decision.selected_alternative_id;
              return (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSel
                      ? 'bg-emerald-50/25 border-emerald-300 ring-1 ring-emerald-400/20 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isSel && (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" /> SELECTED
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900">{alt.title}</h4>
                    </div>
                    {alt.total_score !== null && alt.total_score !== undefined && (
                      <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                        Composite Score: <strong className="text-blue-600">{alt.total_score}</strong> / 100
                      </span>
                    )}
                  </div>
                  {alt.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{alt.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column Metadata */}
      <div className="space-y-6">
        {/* Stakeholders Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Stakeholders</span>
            </h3>
            <span className="text-[11px] text-slate-400">Team</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">{decision.owner_name}</span>
                <span className="text-[10px] text-slate-400">{decision.owner_email}</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                Lead Author
              </span>
            </div>

            {decision.stakeholders?.map((st) => (
              <div key={st.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-900">{st.display_name}</span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {st.stakeholder_role || 'Contributor'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Approval Pipeline Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Approval Pipeline</span>
            </h3>
            <button
              onClick={() => setActiveTab('approvals')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Details &rarr;
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {approvals?.steps?.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/60 border border-slate-100">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs ${
                    step.status === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : step.status === 'pending'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step.status === 'approved' ? '✓' : step.step_order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{step.step_name}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{step.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        {decision.tags?.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Domain Tags</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {decision.tags.map((t) => (
                <span key={t.id} className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
