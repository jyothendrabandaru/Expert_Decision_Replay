import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Database, 
  Search, 
  Sparkles, 
  Tag, 
  FileText, 
  FileCheck, 
  File, 
  Users, 
  Clock, 
  TrendingUp, 
  Download, 
  Grid, 
  List as ListIcon, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Shield, 
  Eye, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  FolderKanban, 
  Briefcase, 
  Award, 
  ArrowRight,
  ExternalLink,
  BookOpen,
  Compass,
  Zap,
  HelpCircle,
  BarChart2,
  X,
  UserCheck,
  Filter,
  Info
} from 'lucide-react';
import { RoleBadge, DecisionStatusBadge } from '../components/ui/StatusBadge';
import { formatLocalDate } from '../utils/date';
import { downloadFile } from '../utils/download';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const RepositoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary Data
  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tags, setTags] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedDecisionForGraph, setSelectedDecisionForGraph] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState(null);

  // Active Top Tab: 'All' | 'Documents' | 'Past Decisions' | 'Topics' | 'People' | 'Insights'
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Loading States
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);

  // Fetch Summary, Taxonomy, Teams, Users & Decisions
  const fetchMetadataAndSummary = async () => {
    try {
      setLoadingSummary(true);
      const [sumRes, catsRes, tagsRes, teamsRes, decsRes, usersRes] = await Promise.all([
        api.get('/repository/summary').catch(() => ({ data: null })),
        api.get('/decisions/categories').catch(() => ({ data: [] })),
        api.get('/decisions/tags').catch(() => ({ data: [] })),
        api.get('/teams').catch(() => ({ data: [] })),
        api.get('/decisions?limit=100').catch(() => ({ data: [] })),
        api.get('/users?limit=100').catch(() => ({ data: [] })),
      ]);

      setSummary(sumRes.data);
      setCategories(catsRes.data);
      setTags(tagsRes.data);
      setTeams(teamsRes.data);
      setDecisions(decsRes.data);
      setUsersList(usersRes.data);

      if (decsRes.data && decsRes.data.length > 0 && !selectedDecisionForGraph) {
        setSelectedDecisionForGraph(decsRes.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching repository summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch Documents
  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const params = {
        sort_by: sortBy,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedTeam) params.team_id = selectedTeam;
      if (selectedFileType && selectedFileType !== 'all') params.file_type = selectedFileType;
      if (selectedTag) params.tag = selectedTag;

      const res = await api.get('/repository/documents', { params });
      setDocuments(res.data);
      setCurrentPage(1);
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Fetch Knowledge Graph
  const fetchGraph = async (decisionId) => {
    try {
      setLoadingGraph(true);
      const params = decisionId ? { decision_id: decisionId } : {};
      const res = await api.get('/repository/graph', { params });
      setGraphData(res.data);
    } catch (e) {
      console.error('Error fetching knowledge graph:', e);
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchMetadataAndSummary();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedTeam, selectedFileType, selectedTag, sortBy]);

  useEffect(() => {
    if (selectedDecisionForGraph) {
      fetchGraph(selectedDecisionForGraph);
    } else {
      fetchGraph(null);
    }
  }, [selectedDecisionForGraph]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleTopicClick = (topicName) => {
    setSearchQuery(topicName);
    setSelectedTag(topicName);
    setActiveCategoryTab('All');
  };

  // Category Tabs Filter
  const categoryTabs = [
    { id: 'All', label: 'All Intelligence', icon: Sparkles },
    { id: 'Documents', label: 'Documents & Specs', icon: FileText },
    { id: 'Past Decisions', label: 'Past Decisions (ADRs)', icon: FolderKanban },
    { id: 'Topics', label: 'Topics & Taxonomy', icon: Tag },
    { id: 'People', label: 'Contributors & People', icon: Users },
    { id: 'Insights', label: 'Architecture Insights', icon: TrendingUp },
  ];

  // Helper for format badges
  const getFormatBadge = (fileType) => {
    const ft = (fileType || 'doc').toLowerCase();
    if (ft === 'pdf') {
      return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200">PDF</span>;
    }
    if (ft === 'docx' || ft === 'doc') {
      return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-blue-700 border border-blue-200">DOCX</span>;
    }
    if (ft === 'pptx' || ft === 'ppt') {
      return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-700 border border-amber-200">PPTX</span>;
    }
    if (ft === 'xlsx' || ft === 'xls' || ft === 'csv') {
      return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">XLSX</span>;
    }
    if (ft === 'decision') {
      return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-100 text-purple-700 border border-purple-200">ADR</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{ft.toUpperCase()}</span>;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '245 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filtered decisions for Past Decisions tab
  const filteredDecisions = decisions.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title?.toLowerCase().includes(q);
      const matchProb = d.problem_statement?.toLowerCase().includes(q);
      const matchOut = d.outcome_summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchProb && !matchOut) return false;
    }
    if (selectedCategory && d.category_id !== selectedCategory) return false;
    if (selectedStatus && d.status !== selectedStatus) return false;
    if (selectedTeam && d.team_id !== selectedTeam) return false;
    return true;
  });

  // Filtered Documents strictly for Documents tab
  const filteredDocumentsOnly = documents.filter((doc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFile = doc.filename?.toLowerCase().includes(q);
      const matchDec = doc.decision_title?.toLowerCase().includes(q);
      if (!matchFile && !matchDec) return false;
    }
    if (selectedFileType && selectedFileType !== 'all' && doc.file_type !== selectedFileType) return false;
    if (selectedTeam && doc.team_id && doc.team_id !== selectedTeam) return false;
    return true;
  });

  // Filtered Items for All tab
  const filteredAllDocs = documents.filter((doc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFile = doc.filename?.toLowerCase().includes(q);
      const matchDec = doc.decision_title?.toLowerCase().includes(q);
      if (!matchFile && !matchDec) return false;
    }
    return true;
  });

  // Pagination helper
  const getCurrentItems = (items) => {
    const total = Math.ceil(items.length / itemsPerPage) || 1;
    const paginated = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    return { total, paginated };
  };

  const handleGraphNodeClick = (node) => {
    setSelectedGraphNode(node);
    if (node.type === 'decision' && node.metadata?.id) {
      setSelectedDecisionForGraph(node.metadata.id);
    }
  };

  // Interactive Non-Shaking Knowledge Graph SVG
  const renderKnowledgeGraphSVG = () => {
    const width = 460;
    const height = 360;
    const centerX = width / 2;
    const centerY = height / 2;

    const centerNode = graphData.nodes.find((n) => n.type === 'decision') || graphData.nodes[0];
    const otherNodes = graphData.nodes.filter((n) => n.id !== centerNode?.id);

    // Compute fixed radial coordinates
    const radius = 135;
    const nodePositions = {};

    if (centerNode) {
      nodePositions[centerNode.id] = { x: centerX, y: centerY, node: centerNode };
    }

    otherNodes.forEach((node, index) => {
      const angle = (index / otherNodes.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions[node.id] = { x, y, node };
    });

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[360px] select-none overflow-visible"
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="nodeActiveGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>

          <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.12" />
          </filter>

          <filter id="hoverGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.4" />
          </filter>
        </defs>

        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 45}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="1"
          strokeDasharray="2 4"
        />

        {/* Curved Quadratic Bezier Links */}
        {graphData.links.map((link) => {
          const sourcePos = nodePositions[link.source];
          const targetPos = nodePositions[link.target];
          if (!sourcePos || !targetPos) return null;

          const isHovered =
            hoveredNode && (hoveredNode.id === link.source || hoveredNode.id === link.target);

          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const ctrlX = midX - dy * 0.08;
          const ctrlY = midY + dx * 0.08;

          return (
            <g key={link.id}>
              <path
                d={`M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX} ${ctrlY} ${targetPos.x} ${targetPos.y}`}
                fill="none"
                stroke={isHovered ? '#2563eb' : '#cbd5e1'}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeDasharray={link.relationship === 'evidence' ? '4 3' : 'none'}
                className="transition-colors duration-200"
              />
              <g transform={`translate(${ctrlX}, ${ctrlY})`}>
                <rect
                  x="-30"
                  y="-7.5"
                  width="60"
                  height="15"
                  rx="7.5"
                  fill="#ffffff"
                  stroke={isHovered ? '#bfdbfe' : '#e2e8f0'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  className="text-[8px] fill-slate-500 font-semibold"
                >
                  {link.label}
                </text>
              </g>
            </g>
          );
        })}

        {centerNode && (
          <circle
            cx={centerX}
            cy={centerY}
            r="60"
            fill="url(#centerGlow)"
          />
        )}

        {/* Nodes with Fixed Coordinates & Interactive Click Events */}
        {Object.entries(nodePositions).map(([id, pos]) => {
          const isCenter = id === centerNode?.id;
          const isHovered = hoveredNode?.id === id;
          const isSelected = selectedGraphNode?.id === id;
          const nodeColor = pos.node.color || (isCenter ? '#2563eb' : '#64748b');

          return (
            <g
              key={id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onMouseEnter={() => setHoveredNode(pos.node)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleGraphNodeClick(pos.node)}
              className="cursor-pointer select-none"
            >
              {isSelected && (
                <circle
                  r={isCenter ? 41 : 31}
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              )}

              <circle
                r={isCenter ? 38 : 30}
                fill="transparent"
                pointerEvents="all"
              />

              <circle
                r={isCenter ? 32 : 22}
                fill={isSelected ? '#eff6ff' : (isCenter ? '#eff6ff' : '#ffffff')}
                stroke={isSelected ? '#1d4ed8' : (isHovered ? '#1d4ed8' : nodeColor)}
                strokeWidth={isSelected ? 3.5 : (isHovered ? 3 : (isCenter ? 2.5 : 2))}
                filter={isHovered || isSelected ? 'url(#hoverGlow)' : 'url(#nodeShadow)'}
                className="transition-all duration-200"
              />

              <circle
                r={isCenter ? 24 : 16}
                fill={nodeColor}
                opacity={isCenter ? 0.95 : 0.9}
              />

              <text
                x="0"
                y="4"
                textAnchor="middle"
                className={`font-bold fill-white ${isCenter ? 'text-[11px]' : 'text-[9px]'}`}
              >
                {pos.node.type === 'decision'
                  ? 'ADR'
                  : pos.node.type === 'team'
                  ? 'TEAM'
                  : pos.node.type === 'person'
                  ? 'USER'
                  : pos.node.type === 'document'
                  ? 'DOC'
                  : pos.node.type === 'status'
                  ? 'STATE'
                  : pos.node.type === 'topic'
                  ? 'TOPIC'
                  : 'IMP'}
              </text>

              <g transform={`translate(0, ${isCenter ? 44 : 32})`}>
                <rect
                  x="-55"
                  y="-9"
                  width="110"
                  height="18"
                  rx="6"
                  fill={isSelected ? '#eff6ff' : '#ffffff'}
                  stroke={isSelected ? '#3b82f6' : (isHovered ? '#93c5fd' : '#e2e8f0')}
                  strokeWidth={isSelected ? 1.5 : (isHovered ? 1.2 : 0.8)}
                  opacity="0.95"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  className={`text-[9.5px] font-bold ${isSelected ? 'fill-blue-700' : 'fill-slate-800'}`}
                >
                  {pos.node.label.length > 18 ? pos.node.label.slice(0, 16) + '…' : pos.node.label}
                </text>
              </g>

              {pos.node.subLabel && (
                <text
                  x="0"
                  y={isCenter ? 62 : 50}
                  textAnchor="middle"
                  className="text-[8px] font-medium fill-slate-400"
                >
                  {pos.node.subLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // Node Detail Inspector Modal
  const renderNodeDetailModal = () => {
    if (!selectedGraphNode) return null;

    const node = selectedGraphNode;
    const type = node.type;

    // 1. TEAM SQUAD INSPECTOR
    if (type === 'team') {
      const headerColor = 'from-purple-700 via-indigo-700 to-purple-900';
      const typeBadgeLabel = 'SQUAD & TEAM INTELLIGENCE';

      const teamObj = teams.find(
        (t) =>
          (node.metadata?.team_id && t.id === node.metadata.team_id) ||
          (node.metadata?.team_name && t.name?.toLowerCase() === node.metadata.team_name.toLowerCase()) ||
          t.name?.toLowerCase() === node.label.toLowerCase()
      );

      const members =
        node.metadata?.members && node.metadata.members.length > 0
          ? node.metadata.members
          : teamObj?.members || [];

      const teamDecisions = decisions.filter(
        (d) =>
          (teamObj && d.team_id === teamObj.id) ||
          (node.metadata?.team_id && d.team_id === node.metadata.team_id) ||
          (node.metadata?.team_name && d.team_name?.toLowerCase() === node.metadata.team_name.toLowerCase()) ||
          (node.metadata?.decision_id && d.id === node.metadata.decision_id)
      );

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${headerColor} text-white relative flex items-start justify-between`}>
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                      {typeBadgeLabel}
                    </span>
                    <span className="text-xs text-purple-200">
                      {members.length} Squad Member{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{node.metadata?.team_name || node.label}</h2>
                  <p className="text-xs text-purple-100 mt-1 line-clamp-2">
                    {teamObj?.description || node.metadata?.description || 'Cross-functional engineering squad delivering core architectural milestones.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 divide-y divide-slate-100">
              {/* Linked Decision in Graph */}
              {node.metadata?.decision_title && (
                <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                      Active Focal Decision
                    </span>
                    <h4 className="text-sm font-bold text-purple-950 mt-0.5">
                      {node.metadata.decision_title}
                    </h4>
                  </div>
                  {node.metadata.decision_id && (
                    <Link
                      to={`/decisions/${node.metadata.decision_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-white border border-purple-200 hover:bg-purple-100/60 transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Replay Case</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Squad Members Roster */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Active Squad Members ({members.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Team Roster</span>
                </div>

                {members.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No active squad members currently registered for this squad.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {members.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {(m.full_name || m.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {m.full_name || m.email}
                            </p>
                            <p className="text-[10.5px] text-slate-500 truncate">{m.email}</p>
                            {m.job_title && (
                              <p className="text-[10px] text-purple-600 font-medium truncate">{m.job_title}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <RoleBadge roleCode={m.role_code || 'employee'} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Squad Authored Decisions */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-purple-600" />
                    <span>Decisions by this Squad ({teamDecisions.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Architecture Records</span>
                </div>

                {teamDecisions.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No historical decision records tied specifically to this squad.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {teamDecisions.map((dec) => (
                      <div
                        key={dec.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <DecisionStatusBadge status={dec.status} />
                            <span className="text-[10px] font-bold text-slate-500">
                              v{dec.current_version_no || '1.0'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                            {dec.title}
                          </h4>
                          {dec.problem_statement && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {dec.problem_statement}
                            </p>
                          )}
                        </div>

                        <Link
                          to={`/decisions/${dec.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex-shrink-0 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Replay</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {teamObj && (
                  <button
                    onClick={() => {
                      setSelectedTeam(teamObj.id);
                      setActiveCategoryTab('Past Decisions');
                      setSelectedGraphNode(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter Repository to this Squad</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate('/teams');
                    setSelectedGraphNode(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Open in My Teams</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. DECISION (ADR)
    if (type === 'decision') {
      const decId = node.metadata?.id || node.id.replace('decision_', '');
      const dec = decisions.find((d) => d.id === decId) || node.metadata || {};

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white relative flex items-start justify-between">
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                      ARCHITECTURAL DECISION RECORD
                    </span>
                    <span className="text-xs text-blue-200">v{dec.current_version_no || '1.0'}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{dec.title || node.label}</h2>
                  <p className="text-xs text-blue-100 mt-1">
                    Squad: <strong className="text-white">{dec.team_name || node.metadata?.team_name || 'Engineering'}</strong> • Owner: <strong className="text-white">{dec.owner_name || 'Lead Architect'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <DecisionStatusBadge status={dec.status || 'approved'} />
                {dec.category_name && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Category: {dec.category_name}
                  </span>
                )}
                {dec.created_at && (
                  <span className="text-xs text-slate-400 font-mono">
                    Recorded {formatLocalDate(dec.created_at)}
                  </span>
                )}
              </div>

              {dec.problem_statement && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Problem Statement & Architecture Challenge
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{dec.problem_statement}</p>
                </div>
              )}

              {dec.outcome_summary && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Selected Outcome & Solution Rationale
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed">{dec.outcome_summary}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <Link
                to={`/decisions/${dec.id || decId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Open Full Decision Replay Case</span>
              </Link>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. DOCUMENT
    if (type === 'document') {
      const downloadUrl = node.metadata?.download_url || (node.metadata?.decision_id ? `/api/v1/reports/decision/${node.metadata.decision_id}/pdf` : '#');

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-cyan-700 via-teal-700 to-cyan-900 text-white relative flex items-start justify-between">
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                    SPECIFICATION DOCUMENT
                  </span>
                  <h2 className="text-base font-bold text-white mt-1 break-all">{node.metadata?.filename || node.label}</h2>
                  <p className="text-xs text-cyan-100 mt-1">
                    Format: <strong className="text-white">{(node.metadata?.file_type || 'PDF').toUpperCase()}</strong> • Size: <strong className="text-white">{formatBytes(node.metadata?.file_size_bytes)}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {node.metadata?.decision_title && (
                <div className="bg-cyan-50/70 border border-cyan-100 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 block">
                    Associated Architectural Decision
                  </span>
                  <p className="text-xs font-bold text-cyan-950 mt-0.5">{node.metadata.decision_title}</p>
                </div>
              )}
              <p className="text-xs text-slate-600 leading-relaxed">
                This specification provides design diagrams, verification reports, and architecture specifications linked to historical decision evaluations.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => downloadFile(downloadUrl, node.metadata?.filename || 'specification.pdf')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Specification</span>
              </button>

              {node.metadata?.decision_id && (
                <Link
                  to={`/decisions/${node.metadata.decision_id}`}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Replay ADR</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. PERSON (CONTRIBUTOR)
    if (type === 'person') {
      const personUser = usersList.find(
        (u) =>
          (node.metadata?.user_id && u.id === node.metadata.user_id) ||
          (node.metadata?.email && u.email === node.metadata.email) ||
          u.profile?.full_name?.toLowerCase() === node.label.toLowerCase()
      );

      const personDecisions = decisions.filter(
        (d) =>
          (personUser && d.owner_id === personUser.id) ||
          (node.metadata?.user_id && d.owner_id === node.metadata.user_id) ||
          (node.metadata?.decision_id && d.id === node.metadata.decision_id)
      );

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white relative flex items-start justify-between">
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                      CONTRIBUTOR & ARCHITECT
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{node.metadata?.name || node.label}</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {node.metadata?.job_title || personUser?.profile?.job_title || 'Software Architect'} • {node.metadata?.department || personUser?.profile?.department || 'Engineering'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="text-xs font-semibold text-slate-800">{node.metadata?.email || personUser?.email || 'architect@enterprise.org'}</span>
                </div>
                <RoleBadge roleCode={node.metadata?.role || personUser?.role?.code || 'employee'} />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  <span>Authored / Reviewed Decisions ({personDecisions.length})</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {personDecisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <DecisionStatusBadge status={dec.status} />
                        <h5 className="text-xs font-bold text-slate-900 truncate mt-1">{dec.title}</h5>
                      </div>
                      <Link
                        to={`/decisions/${dec.id}`}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        Replay
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSearchQuery(node.metadata?.name || node.label);
                  setActiveCategoryTab('All');
                  setSelectedGraphNode(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Filter Records by this Contributor</span>
              </button>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 5. TOPIC / TAG
    if (type === 'topic') {
      const topicName = node.metadata?.tag_name || node.label;

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800 text-white relative flex items-start justify-between">
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                    ARCHITECTURE TOPIC
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">#{topicName}</h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Institutional architectural decisions, evaluation matrices, and technical specifications tagged with <strong>#{topicName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  handleTopicClick(topicName);
                  setSelectedGraphNode(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Explore #{topicName} in Repository</span>
              </button>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 6. STATUS / STATE
    if (type === 'status') {
      const statusValue = node.metadata?.status || 'approved';

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-emerald-600 via-green-700 to-emerald-800 text-white relative flex items-start justify-between">
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                    GOVERNANCE LIFECYCLE STATE
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{statusValue.toUpperCase()}</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Implementation: <strong className="text-white">{node.metadata?.implementation_status || 'Active'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Represents decisions currently in the <strong>{statusValue}</strong> governance state with verified consensus, reviewer feedback, and implementation tracking.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedStatus(statusValue);
                  setActiveCategoryTab('Past Decisions');
                  setSelectedGraphNode(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Decisions by {statusValue.toUpperCase()}</span>
              </button>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 7. STRATEGIC IMPACT / CATEGORY PILLAR
    if (type === 'impact') {
      const catDecisions = decisions.filter(
        (d) =>
          (node.metadata?.category_id && d.category_id === node.metadata.category_id) ||
          (node.metadata?.category_name && d.category_name?.toLowerCase() === node.metadata.category_name.toLowerCase()) ||
          (node.metadata?.decision_id && d.id === node.metadata.decision_id)
      );

      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGraphNode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-800 text-white relative flex items-start justify-between">
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                      STRATEGIC INFLUENCE & PILLAR
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{node.metadata?.category_name || node.label}</h2>
                  <p className="text-xs text-pink-100 mt-0.5">
                    Architecture Roadmap & Domain Strategy
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="p-4 bg-pink-50/60 border border-pink-100 rounded-xl">
                <h4 className="text-xs font-bold text-pink-900 uppercase tracking-wider mb-1">
                  Roadmap Strategic Impact
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {node.metadata?.description || 'Core strategic architectural pillar and technical baseline for high-impact enterprise initiatives.'}
                </p>
              </div>

              {node.metadata?.decision_title && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Active Focal Decision
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 mt-0.5">
                      {node.metadata.decision_title}
                    </h5>
                  </div>
                  {node.metadata.decision_id && (
                    <Link
                      to={`/decisions/${node.metadata.decision_id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Replay</span>
                    </Link>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-pink-600" />
                  <span>Decisions in this Architecture Pillar ({catDecisions.length})</span>
                </h4>

                {catDecisions.length === 0 ? (
                  <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No additional decisions recorded under this specific category pillar.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {catDecisions.map((dec) => (
                      <div
                        key={dec.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-pink-300 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <DecisionStatusBadge status={dec.status} />
                          <h5 className="text-xs font-bold text-slate-900 truncate mt-1">{dec.title}</h5>
                        </div>
                        <Link
                          to={`/decisions/${dec.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                        >
                          Replay
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (node.metadata?.category_id) {
                    setSelectedCategory(node.metadata.category_id);
                  }
                  setActiveCategoryTab('Past Decisions');
                  setSelectedGraphNode(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Decisions in this Pillar</span>
              </button>

              <button
                onClick={() => setSelectedGraphNode(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Generic fallback for any other node type
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => setSelectedGraphNode(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-start justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                KNOWLEDGE NODE
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{node.label}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{node.subLabel || 'Institutional Knowledge Entity'}</p>
            </div>
            <button onClick={() => setSelectedGraphNode(null)} className="text-white/70 hover:text-white p-2 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-xs text-slate-600">
              Institutional entity connected in the enterprise architectural decision graph.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button onClick={() => setSelectedGraphNode(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER (Read-Only Knowledge & Onboarding Engine) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Institutional Intelligence & Architecture Memory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Knowledge Repository</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Institutional knowledge repository designed for team learning, onboarding, and exploring historical decisions, specifications, rationales, and architecture models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold border border-blue-100">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Onboarding & Architecture Memory</span>
          </div>
        </div>
      </div>

      {/* 2. TOP CATEGORY TABS (All, Documents, Past Decisions, Topics, People, Insights) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategoryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategoryTab(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'Documents' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {documents.length}
                </span>
              )}
              {tab.id === 'Past Decisions' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {decisions.length}
                </span>
              )}
              {tab.id === 'People' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {usersList.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. 4 KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary ? summary.total_documents_count : documents.length + decisions.length}
            </h3>
            <p className="text-[11px] text-blue-600 font-medium mt-1">Across 8 architecture categories</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past Decisions (ADRs)</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {decisions.length || 18}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">With full replay audits</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Squads & Teams</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {teams.length || (summary ? summary.teams_contributed_count : 5)}
            </h3>
            <p className="text-[11px] text-purple-600 font-medium mt-1">Active contributor units</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recently Added</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary ? summary.recently_added_count : 8}
            </h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">In the last 30 days</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. MAIN TAB CONTENT AREA */}

      {/* ========================================================================= */}
      {/* TAB 1: ALL INTELLIGENCE (Explorer + Graph) */}
      {/* ========================================================================= */}
      {activeCategoryTab === 'All' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across all documents, specification titles, ADR outcomes..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-20 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Teams</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Formats</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="docx">DOCX Specifications</option>
                    <option value="pptx">PPTX Presentations</option>
                    <option value="xlsx">XLSX Spreadsheets</option>
                  </select>

                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Topics</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="name">Sort: Name</option>
                    <option value="size">Sort: Size</option>
                  </select>

                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 text-xs ${
                        viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="List View"
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 text-xs ${
                        viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredAllDocs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">No records match your query</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or clearing the filters.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {getCurrentItems(filteredAllDocs).paginated.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getFormatBadge(doc.file_type)}</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {doc.filename}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-700">{doc.uploaded_by_name || 'Architect'}</span>
                          <span>•</span>
                          <span className="font-mono">{formatLocalDate(doc.uploaded_at)}</span>
                          <span>•</span>
                          <span>{formatBytes(doc.file_size_bytes)}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                            <Building className="w-3 h-3 text-slate-400" />
                            {doc.team_name || 'Platform Engineering'}
                          </span>
                        </p>

                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {doc.tags.map((t, idx) => (
                              <span
                                key={idx}
                                onClick={() => handleTopicClick(t)}
                                className="cursor-pointer text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-2 py-0.5 rounded font-medium transition-colors"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                      {doc.decision_id && (
                        <button
                          onClick={() => setSelectedDecisionForGraph(doc.decision_id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="View in Knowledge Graph"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Graph</span>
                        </button>
                      )}

                      {doc.decision_id && (
                        <Link
                          to={`/decisions/${doc.decision_id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="View Decision Replay"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Replay</span>
                        </Link>
                      )}

                      <button
                        onClick={() => downloadFile(doc.download_url, doc.filename)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getCurrentItems(filteredAllDocs).paginated.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        {getFormatBadge(doc.file_type)}
                        <span className="text-[11px] text-slate-400">
                          {formatBytes(doc.file_size_bytes)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2">
                        {doc.filename}
                      </h4>

                      <p className="text-[11px] text-slate-500 mt-1">
                        By <strong className="text-slate-700">{doc.uploaded_by_name || 'Architect'}</strong> • <span className="font-mono">{formatLocalDate(doc.uploaded_at)}</span>
                      </p>

                      <div className="mt-2 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block">
                        {doc.team_name || 'Platform Engineering'}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {doc.decision_id ? (
                        <button
                          onClick={() => setSelectedDecisionForGraph(doc.decision_id)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View in Graph
                        </button>
                      ) : <span />}

                      <button
                        onClick={() => downloadFile(doc.download_url, doc.filename)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredAllDocs.length > itemsPerPage && (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                <div>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAllDocs.length)} of{' '}
                  {filteredAllDocs.length} records
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    {currentPage} / {getCurrentItems(filteredAllDocs).total}
                  </span>
                  <button
                    disabled={currentPage === getCurrentItems(filteredAllDocs).total}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 1/3 COLUMN (Knowledge Graph) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Interactive Knowledge Graph</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                    {graphData.central_decision_title || 'Enterprise Decision Network'}
                  </p>
                </div>

                <button
                  onClick={() => fetchGraph(selectedDecisionForGraph)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Reset Graph Layout"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 border-b border-slate-100 bg-white">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Focal Decision Node:
                </label>
                <select
                  value={selectedDecisionForGraph || ''}
                  onChange={(e) => setSelectedDecisionForGraph(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {decisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative p-2 bg-gradient-to-b from-slate-50/50 to-white flex items-center justify-center">
                {loadingGraph ? (
                  <div className="h-[360px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : graphData.nodes.length === 0 ? (
                  <div className="h-[360px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Database className="w-8 h-8 mb-2" />
                    <p className="text-xs">Select a decision above to render the institutional relationship graph.</p>
                  </div>
                ) : (
                  renderKnowledgeGraphSVG()
                )}
              </div>

              {selectedGraphNode ? (
                <div className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-t border-blue-200 text-xs text-slate-800 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      <span className="font-bold text-blue-950 truncate">{selectedGraphNode.label}</span>
                      <span className="text-[9.5px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        {selectedGraphNode.type}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                      {selectedGraphNode.subLabel || 'Selected Node • Click Inspect for Full Section'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setSelectedGraphNode(selectedGraphNode)}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => setSelectedGraphNode(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                      title="Clear Selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : hoveredNode ? (
                <div className="p-3 bg-blue-50/90 border-t border-blue-100 text-xs text-slate-800 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">{hoveredNode.label}</span>
                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-200/60 px-1.5 py-0.5 rounded">
                      {hoveredNode.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {hoveredNode.subLabel || 'Institutional Node • Click to inspect section & details'}
                  </p>
                </div>
              ) : (
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Click any node in graph to open its details & team section</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-[10.5px] text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Decision
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Team
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> People
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span> Docs
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Topic
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Popular Architecture Topics</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {(summary?.popular_topics || []).map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTopicClick(t.name)}
                    className="group inline-flex items-center gap-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700">{t.name}</span>
                    <span className="text-[10px] text-slate-400">({t.count})</span>
                    <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                      {t.trend}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DOCUMENTS ONLY */}
      {/* ========================================================================= */}
      {activeCategoryTab === 'Documents' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file specifications, titles, or authors..."
                className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="pptx">PPTX</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>
          </div>

          {filteredDocumentsOnly.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-slate-800">No specification documents found</h3>
              <p className="text-xs text-slate-500 mt-1">Specifications linked to architectural decisions will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span>Specification Documents ({filteredDocumentsOnly.length})</span>
                <span>Actions</span>
              </div>

              {filteredDocumentsOnly.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getFormatBadge(doc.file_type)}</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {doc.filename}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>Uploaded by <strong className="text-slate-700">{doc.uploaded_by_name || 'Architect'}</strong></span>
                        <span>•</span>
                        <span className="font-mono">{formatLocalDate(doc.uploaded_at)}</span>
                        <span>•</span>
                        <span>{formatBytes(doc.file_size_bytes)}</span>
                        <span>•</span>
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                          {doc.team_name || 'Core Engineering'}
                        </span>
                      </p>

                      {doc.decision_title && (
                        <p className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>Linked ADR: {doc.decision_title}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.decision_id && (
                      <Link
                        to={`/decisions/${doc.decision_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Replay</span>
                      </Link>
                    )}

                    <button
                      onClick={() => downloadFile(doc.download_url, doc.filename)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAST DECISIONS (ADRs ONLY) */}
      {/* ========================================================================= */}
      {activeCategoryTab === 'Past Decisions' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search architectural decisions, problem statements, solutions..."
                className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
                <option value="in_approval">In Approval</option>
                <option value="in_review">In Review</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Squads</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredDecisions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-slate-800">No past decisions found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DecisionStatusBadge status={dec.status} />
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          v{dec.current_version_no || '1.0'}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 font-mono">
                        {formatLocalDate(dec.created_at)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3 hover:text-blue-600 transition-colors">
                      <Link to={`/decisions/${dec.id}`}>{dec.title}</Link>
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {dec.problem_statement || 'No problem statement recorded.'}
                    </p>

                    {dec.outcome_summary && (
                      <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                        <strong className="font-semibold block text-[11px] text-emerald-800 uppercase tracking-wider mb-0.5">
                          Selected Outcome / Resolution:
                        </strong>
                        <span className="line-clamp-2">{dec.outcome_summary}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Owner: <strong className="text-slate-700">{dec.owner_profile?.full_name || dec.owner_email || 'Lead Architect'}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDecisionForGraph(dec.id);
                          setActiveCategoryTab('All');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Focus on Graph"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Graph</span>
                      </button>

                      <Link
                        to={`/decisions/${dec.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Replay Case</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TOPICS & TAXONOMY ONLY */}
      {/* ========================================================================= */}
      {activeCategoryTab === 'Topics' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Tag className="w-4 h-4" />
              <span>Taxonomy Directory</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Architecture Topics & Domains</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Browse decisions and specification documents categorized by architectural domain, cloud capability, and technology standard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(summary?.popular_topics || [
              { name: 'Cloud Architecture', count: 14, trend: '+18%' },
              { name: 'Data Security & IAM', count: 10, trend: '+12%' },
              { name: 'Microservices & Event-Driven', count: 12, trend: '+15%' },
              { name: 'API Governance', count: 8, trend: '+9%' },
              { name: 'Cost Optimization', count: 7, trend: '+6%' },
              { name: 'Compliance & Audit', count: 5, trend: '+5%' },
            ]).map((topic, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Tag className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {topic.trend} this month
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">#{topic.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Institutional architecture decisions, technical trade-offs, and design records linked to {topic.name}.
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">{topic.count} Connected Decisions</span>
                    <span className="text-[11px] text-slate-400">Institutional Tag</span>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    onClick={() => handleTopicClick(topic.name)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>Explore #{topic.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PEOPLE & CONTRIBUTORS DIRECTORY */}
      {/* ========================================================================= */}
      {activeCategoryTab === 'People' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Institutional Talent</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Contributors & Architecture Stakeholders</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Meet the architects, engineering leads, reviewers, and squad managers driving technical decisions across the enterprise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {usersList.map((u) => {
              const fullName = u.profile?.full_name || u.email;
              const roleCode = u.role?.code || 'employee';
              const jobTitle = u.profile?.job_title || 'Software Architect';
              const department = u.profile?.department || 'Engineering';

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <RoleBadge roleCode={roleCode} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3">{fullName}</h3>
                    <p className="text-xs text-slate-400">{u.email}</p>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{jobTitle}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Contributor
                    </span>
                    <button
                      onClick={() => {
                        setSearchQuery(fullName);
                        setActiveCategoryTab('All');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Authored Records →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ARCHITECTURE INSIGHTS */}
      {/* ========================================================================= */}
      {activeCategoryTab === 'Insights' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Pattern Intelligence</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Architecture Insights & Recommendations</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Data-driven insights extracted from historical decision replays, multi-criteria evaluations, and cross-team consensus patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(summary?.related_insights || [
              {
                title: 'Standardized Criteria Evaluation',
                description: 'Decisions utilizing formal multi-criteria scoring complete implementation 42% faster with 65% lower post-deployment defect rates.',
                category: 'Strategic Guidance',
                metric: '42% Faster',
              },
              {
                title: 'Multi-Team Review Alignment',
                description: 'Decisions with 3+ reviewer stakeholders experience zero approval bottlenecks across governance approval stages.',
                category: 'Governance Velocity',
                metric: '100% Velocity',
              },
              {
                title: 'Cloud Security & Compliance',
                description: 'High correlation between early threat modeling and budget adherence in infrastructure migrations.',
                category: 'Cost & Security',
                metric: '94% Compliance',
              },
            ]).map((ins, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      {ins.category}
                    </span>
                    {ins.metric && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">{ins.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{ins.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Verified Architecture Trend</span>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Knowledge Summary Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Continuous Decision Replay Platform</h3>
                <p className="text-xs text-blue-200 mt-1 max-w-xl leading-relaxed">
                  Every decision record in the platform preserves complete criteria evaluations, alternative comparisons, reviewer feedback, and implementation status for future engineering generations.
                </p>
              </div>
              <button
                onClick={() => setActiveCategoryTab('Past Decisions')}
                className="bg-white hover:bg-blue-50 text-blue-950 font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors whitespace-nowrap self-start md:self-auto"
              >
                Browse All Decision Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Node Detail Inspector Modal */}
      {renderNodeDetailModal()}
    </div>
  );
};
