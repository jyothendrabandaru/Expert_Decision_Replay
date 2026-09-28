import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderKanban, 
  ChevronRight, 
  Tag, 
  Calendar,
  Layers,
  ArrowUpDown,
  Grid,
  List as ListIcon,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
  Building,
  RotateCcw,
  Check,
  ShieldCheck
} from 'lucide-react';
import { DecisionStatusBadge, ImplementationStatusBadge } from '../../components/ui/StatusBadge';
import { formatLocalDate } from '../../utils/date';
import api from '../../api/client';

export const DecisionsListPage = () => {
  const [decisions, setDecisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const fetchMetadata = async () => {
    try {
      const [catsRes, teamsRes] = await Promise.all([
        api.get('/decisions/categories').catch(() => ({ data: [] })),
        api.get('/teams').catch(() => ({ data: [] })),
      ]);
      setCategories(catsRes.data);
      setTeams(teamsRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedTeam) params.team_id = selectedTeam;

      const res = await api.get('/decisions', { params });
      setDecisions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [selectedCategory, selectedStatus, selectedTeam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDecisions();
  };

  // Metrics summary
  const approvedCount = decisions.filter(d => d.status === 'approved' || d.status === 'implemented').length;
  const inReviewCount = decisions.filter(d => d.status === 'in_review' || d.status === 'in_approval').length;
  const draftCount = decisions.filter(d => d.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FolderKanban className="w-4 h-4" />
            <span>Architecture Decision Registry (ADR)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Decisions Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage, evaluate, and replay strategic organizational decision case files.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/decisions/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Decision Case</span>
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY METRIC PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{decisions.length}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved / Live</p>
            <h3 className="text-xl font-black text-emerald-600 mt-1">{approvedCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Review & Approval</p>
            <h3 className="text-xl font-black text-amber-600 mt-1">{inReviewCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Drafts in Progress</p>
            <h3 className="text-xl font-black text-slate-600 mt-1">{draftCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions by title, problem statement, or resolution..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 pl-10 pr-20 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="in_approval">In Approval</option>
            <option value="approved">Approved</option>
            <option value="implemented">Implemented</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes Requested</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 text-xs ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 text-xs ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT (LIST VS GRID VIEW) */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2">Loading decisions registry...</p>
        </div>
      ) : decisions.length === 0 ? (
        <div className="py-16 text-center px-4 bg-white rounded-2xl border border-slate-200 p-8">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No decisions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No decision records matched your query. Create a new decision to start building organizational architecture intelligence.
          </p>
          <Link
            to="/decisions/new"
            className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Decision</span>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DecisionStatusBadge
                      status={d.status}
                      approvalRole={d.current_approval_role}
                      approvalStep={d.current_approval_step}
                    />
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      v{d.current_version_no}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 font-mono">
                    {formatLocalDate(d.created_at)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  <Link to={`/decisions/${d.id}`}>{d.title}</Link>
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {d.problem_statement || 'No problem statement recorded.'}
                </p>

                {d.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {d.tags.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-medium"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 truncate">
                  <span className="font-semibold text-slate-700">{d.owner_name}</span>
                </div>

                <Link
                  to={`/decisions/${d.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Decision Case & Problem Context</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Governance Status</th>
                  <th className="py-3.5 px-4">Implementation</th>
                  <th className="py-3.5 px-4">Lead Author</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 min-w-[300px]">
                      <Link
                        to={`/decisions/${d.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors block truncate max-w-md"
                      >
                        {d.title}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{d.problem_statement}</p>
                      {d.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {d.tags.map((t) => (
                            <span
                              key={t.id}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                            >
                              #{t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                      {d.category?.name || 'General'}
                    </td>
                    <td className="py-4 px-4">
                      <DecisionStatusBadge
                        status={d.status}
                        approvalRole={d.current_approval_role}
                        approvalStep={d.current_approval_step}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <ImplementationStatusBadge status={d.implementation_status} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 block text-xs">{d.owner_name}</span>
                      <span className="text-slate-400 text-[10.5px]">{d.owner_email}</span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-600">
                      v{d.current_version_no}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/decisions/${d.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Replay</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
