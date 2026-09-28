import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, FolderKanban, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { downloadFile } from '../utils/download';

export const ReportsPage = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await api.get('/decisions');
        setDecisions(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to fetch decisions for reports:', e);
        setDecisions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisions();
  }, []);

  const getCategoryName = (cat) => {
    if (!cat) return '';
    if (typeof cat === 'string') return cat;
    return cat.name || '';
  };

  const filteredDecisions = (Array.isArray(decisions) ? decisions : []).filter((d) => {
    if (!d) return false;
    const s = search.toLowerCase().trim();
    if (!s) return true;
    const title = (d.title || '').toLowerCase();
    const owner = (d.owner_name || '').toLowerCase();
    const categoryName = getCategoryName(d.category).toLowerCase();
    return title.includes(s) || owner.includes(s) || categoryName.includes(s);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <FolderKanban className="w-5 h-5" />
            </span>
            <span>Reports & Export Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export full decision case files, audit artifacts, and executive summaries in PDF and XLSX formats
          </p>
        </div>
      </div>

      {/* Global Executive Export Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2.5 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-300 font-bold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Executive Portfolio Audit</span>
          </div>
          <h2 className="text-xl font-black text-white">Enterprise Decisions Executive Summary Workbook</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download a consolidated multi-sheet Excel spreadsheet containing all active, approved, and archived decision records with owners, categories, alternatives, and scores.
          </p>
        </div>
        <button
          onClick={() => downloadFile('/reports/summary/excel', 'EDRP_Decisions_Executive_Summary.xlsx')}
          className="relative z-10 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 flex-shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download Summary (.xlsx)</span>
        </button>
      </div>

      {/* Individual Decision Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Individual Decision Case Reports</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Generate standalone audit reports for any specific architectural record</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 text-slate-700"
            />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {filteredDecisions.length} Available
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No matching decisions found for export.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDecisions.map((d) => {
              const catName = getCategoryName(d.category);
              const decisionId = String(d.id || '');
              const shortId = decisionId.length >= 8 ? decisionId.slice(0, 8) : decisionId;

              return (
                <div key={decisionId || Math.random()} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{d.title || 'Untitled Decision'}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        v{d.current_version_no ?? 1}.0
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5 text-slate-500 text-[11px]">
                      <span className="font-medium text-slate-700">By {d.owner_name || 'Anonymous'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="capitalize">{(d.status || 'draft').replace('_', ' ')}</span>
                      {catName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-indigo-600 font-semibold">{catName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => downloadFile(`/reports/decision/${decisionId}/pdf`, `Decision_${shortId}_CaseFile.pdf`)}
                      className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-2 rounded-xl border border-rose-200/80 transition-all transform hover:-translate-y-0.5 shadow-xs cursor-pointer"
                      title="Download Decision Case PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>Case PDF</span>
                    </button>

                    <button
                      onClick={() => downloadFile(`/reports/decision/${decisionId}/excel`, `Decision_${shortId}_Matrix.xlsx`)}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3.5 py-2 rounded-xl border border-emerald-200/80 transition-all transform hover:-translate-y-0.5 shadow-xs cursor-pointer"
                      title="Download Decision Matrix Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Matrix Excel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

