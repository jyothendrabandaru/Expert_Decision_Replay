import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  Layers, 
  AlertCircle,
  Activity,
  Sparkles,
  Zap,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Award,
  Calendar,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DecisionStatusBadge, RoleBadge } from '../components/ui/StatusBadge';
import { formatLocalDate, formatLocalDateTime } from '../utils/date';
import api from '../api/client';

export const DashboardPage = () => {
  const { user, roleCode, isAdmin, isManager, isReviewer, isEmployee } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDecisions, setRecentDecisions] = useState([]);

  // Time of day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, decisionsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/decisions?limit=6'),
        ]);
        setStats(statsRes.data);
        setRecentDecisions(decisionsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-500 font-medium">Loading executive dashboard...</p>
      </div>
    );
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-7">
      {/* 1. WELCOME HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-7 rounded-3xl shadow-xl border border-slate-800">
        {/* Subtle mesh background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Enterprise Architecture Operating System</span>
              </span>
              <RoleBadge roleCode={roleCode} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {getGreeting()}, {user?.profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}!
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAdmin && 'Enterprise System Administrator Console — Full Governance, Workflow Orchestration & Audit Control.'}
              {isManager && 'Executive Management Hub — Authorize Decisions, Validate Compliance & Review Performance.'}
              {isReviewer && 'Technical Reviewer Center — Verify Proposals, Analyze Trade-offs & Score Architecture Cases.'}
              {isEmployee && 'Decision Workspace — Propose, Manage, and Track Strategic Architecture Decision Cases.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/decisions/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Decision Case</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. ROLE-TAILORED KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* EMPLOYEE METRICS */}
        {isEmployee && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">My Decisions</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.my_decisions_count ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Total cases authored</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Draft Cases</span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-xs">
                  <FileEdit className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.drafts_count ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Work in progress</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Under Review</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.under_review_count ?? 0}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Awaiting governance sign-off</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved ADRs</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.approved_count ?? 0}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Authorized for rollout</p>
            </div>
          </>
        )}

        {/* REVIEWER METRICS */}
        {isReviewer && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.pending_reviews_count ?? 0}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Requiring your verification</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Reviews</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.assigned_reviews_count ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Total assignments</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Reviews</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.completed_reviews_count ?? 0}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Evaluations signed off</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Queue Action</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <Link to="/reviews" className="inline-block mt-3 text-xs font-bold text-blue-600 hover:text-blue-700">
                Go to Review Queue &rarr;
              </Link>
              <p className="text-[11px] text-slate-400 mt-1">Evaluate pending cases</p>
            </div>
          </>
        )}

        {/* MANAGER METRICS */}
        {isManager && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.pending_approvals_count ?? 0}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Awaiting management sign-off</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Squad Decisions</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.team_decisions_count ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Active case files</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Decisions</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.approved_count ?? 0}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Authorized for execution</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Turnaround</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.avg_turnaround_days ?? 1.5}d</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">Average cycle speed SLA</p>
            </div>
          </>
        )}

        {/* ADMINISTRATOR METRICS */}
        {isAdmin && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Portfolio</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.total_decisions ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Across all squads</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Users</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.active_users ?? 0} / {metrics.total_users ?? 0}</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">Active enterprise seats</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.pending_approvals ?? 0}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Governance queue</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Throughput</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{metrics.completion_rate_pct ?? 0}%</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Sign-off completion</p>
            </div>
          </>
        )}
      </div>

      {/* 3. MAIN CONTENT: RECENT DECISIONS FEED & ACTION LAUNCHER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Recent Decision Case Files */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <span>Recent Architecture Decisions</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Live case feed across squads and lifecycle stages</p>
            </div>
            <Link
              to="/decisions"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDecisions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FolderKanban className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No decision records found.</p>
              </div>
            ) : (
              recentDecisions.map((d) => (
                <div
                  key={d.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2.5 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/decisions/${d.id}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 truncate block transition-colors"
                    >
                      {d.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span>By <strong className="text-slate-700 font-medium">{d.owner_name}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span className="text-blue-600 font-medium">{d.category?.name || 'General'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                        v{d.current_version_no}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{formatLocalDate(d.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                    <DecisionStatusBadge
                      status={d.status}
                      approvalRole={d.current_approval_role}
                      approvalStep={d.current_approval_step}
                    />
                    <Link
                      to={`/decisions/${d.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Replay
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1/3: Quick Action Hub */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>{isAdmin ? 'System Audit Trail' : 'Quick Actions'}</span>
            </h2>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          {isAdmin ? (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
              {stats?.activity_feed?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No recent audit logs recorded.</p>
              ) : (
                stats?.activity_feed?.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:border-slate-200 transition-colors">
                    <span className="font-bold text-slate-800 text-[10.5px] uppercase tracking-wider block">
                      {a.action.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">Entity: {a.entity_type}</span>
                    <span className="text-slate-400 text-[10px] block mt-1">
                      {formatLocalDateTime(a.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/decisions/new"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Record New Decision</h4>
                  <p className="text-[11px] text-slate-500">Initiate trade-off & alternative analysis</p>
                </div>
              </Link>

              <Link
                to="/repository"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Knowledge Repository</h4>
                  <p className="text-[11px] text-slate-500">Explore past ADRs & taxonomy graph</p>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">System Portfolio Analysis</h4>
                  <p className="text-[11px] text-slate-500">Review criteria matrix & velocity</p>
                </div>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Generate Audit Reports</h4>
                  <p className="text-[11px] text-slate-500">Export PDF & Excel case files</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
