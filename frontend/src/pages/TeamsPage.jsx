import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Trash2, 
  UserPlus, 
  X, 
  Shield, 
  Mail, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send, 
  Sparkles,
  ArrowRight,
  Info,
  Check,
  Ban,
  Search
} from 'lucide-react';
import { RoleBadge } from '../components/ui/StatusBadge';
import { formatLocalDate } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const TeamsPage = () => {
  const { user, isAdmin, isManager, roleCode } = useAuth();
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my_teams'); // 'my_teams' | 'explore' | 'requests'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });

  const [selectedTeamRoster, setSelectedTeamRoster] = useState(null);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [joinModalTeam, setJoinModalTeam] = useState(null);
  const [joinReason, setJoinReason] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  const [reviewModalRequest, setReviewModalRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const canManageTeams = isAdmin || isManager;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, requestsRes] = await Promise.all([
        api.get('/teams'),
        api.get('/teams/join-requests').catch(() => ({ data: [] })),
      ]);
      setTeams(teamsRes.data);
      setJoinRequests(requestsRes.data);

      if (canManageTeams) {
        const usersRes = await api.get('/users').catch(() => ({ data: [] }));
        setAllUsers(usersRes.data);
      }

      if (selectedTeamRoster) {
        const updated = teamsRes.data.find((t) => t.id === selectedTeamRoster.id);
        if (updated) setSelectedTeamRoster(updated);
      }
    } catch (e) {
      console.error('Error fetching teams:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter teams user belongs to vs not
  const myTeams = teams.filter((t) =>
    t.members?.some((m) => m.user_id === user?.id)
  );

  const otherTeams = teams.filter(
    (t) => !t.members?.some((m) => m.user_id === user?.id)
  );

  // Filter by search query
  const filteredMyTeams = myTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOtherTeams = otherTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if user has a pending join request for a team
  const hasPendingRequest = (teamId) => {
    return joinRequests.some(
      (r) => r.team_id === teamId && r.status === 'pending' && r.user_id === user?.id
    );
  };

  const getPendingRequestId = (teamId) => {
    const req = joinRequests.find(
      (r) => r.team_id === teamId && r.status === 'pending' && r.user_id === user?.id
    );
    return req ? req.id : null;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', teamForm);
      setTeamForm({ name: '', description: '' });
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to create team.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTeamRoster || !selectedUserIdToAdd) return;
    setAddingMember(true);
    try {
      await api.post(`/teams/${selectedTeamRoster.id}/members`, {
        user_id: selectedUserIdToAdd,
      });
      setSelectedUserIdToAdd('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  const handleOpenJoinModal = (team) => {
    setJoinModalTeam(team);
    setJoinReason('');
  };

  const handleSubmitJoinRequest = async (e) => {
    e.preventDefault();
    if (!joinModalTeam) return;
    setSubmittingJoin(true);
    try {
      await api.post(`/teams/${joinModalTeam.id}/join-requests`, {
        reason: joinReason.trim() || null,
      });
      setJoinModalTeam(null);
      setJoinReason('');
      await fetchData();
      setActiveTab('requests');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to submit join request.');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleCancelJoinRequest = async (requestId) => {
    if (!window.confirm('Cancel this pending join request?')) return;
    try {
      await api.delete(`/teams/join-requests/${requestId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to cancel request.');
    }
  };

  const handleOpenReviewModal = (req, action) => {
    setReviewModalRequest(req);
    setReviewAction(action);
    setReviewNote('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalRequest) return;
    setSubmittingReview(true);
    try {
      await api.post(`/teams/join-requests/${reviewModalRequest.id}/review`, {
        action: reviewAction,
        response_note: reviewNote.trim() || null,
      });
      setReviewModalRequest(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to process request.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingRequestsCount = joinRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            Teams & Organizational Units
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Collaborate within your engineering squads, discover other teams, and request cross-functional memberships.
          </p>
        </div>

        {canManageTeams && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my_teams')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'my_teams'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Teams</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'my_teams' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {myTeams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'explore'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore Other Teams</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'explore' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {otherTeams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{canManageTeams ? 'Join Requests Queue' : 'My Sent Requests'}</span>
            {pendingRequestsCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {activeTab !== 'requests' && (
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: MY TEAMS */}
          {activeTab === 'my_teams' && (
            <div>
              {filteredMyTeams.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">You are not a member of any teams yet</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Browse the organizational units in the "Explore Other Teams" tab and submit a join request.
                  </p>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <span>Explore Teams</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMyTeams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                            {team.name.charAt(0)}
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            Active Member
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base mt-3">{team.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {team.description || 'No description provided for this team.'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Users className="w-4 h-4 text-slate-400" />
                            {team.members?.length || 0} Members
                          </span>
                          <span>Created {formatLocalDate(team.created_at)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3">
                        <button
                          onClick={() => setSelectedTeamRoster(team)}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Members & Roster</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPLORE OTHER TEAMS */}
          {activeTab === 'explore' && (
            <div>
              {filteredOtherTeams.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">You are enrolled in all organization teams!</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    There are no other available teams to join at this moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredOtherTeams.map((team) => {
                    const isPending = hasPendingRequest(team.id);
                    const pendingId = getPendingRequestId(team.id);

                    return (
                      <div
                        key={team.id}
                        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                              {team.name.charAt(0)}
                            </div>
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Request Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                Organization Team
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-base mt-3">{team.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {team.description || 'No description provided.'}
                          </p>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Users className="w-4 h-4 text-slate-400" />
                              {team.members?.length || 0} Members
                            </span>
                            <span>Created {formatLocalDate(team.created_at)}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 flex gap-2">
                          <button
                            onClick={() => setSelectedTeamRoster(team)}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Members</span>
                          </button>

                          {isPending ? (
                            <button
                              onClick={() => handleCancelJoinRequest(pendingId)}
                              className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-2 rounded-lg transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenJoinModal(team)}
                              className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-lg shadow-sm transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Request to Join</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JOIN REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {canManageTeams ? 'Team Join Requests Roster' : 'My Sent Team Membership Requests'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {canManageTeams 
                      ? 'Review and approve/reject employee requests to join organizational engineering squads.' 
                      : 'Track the status and manager responses for your submitted team join requests.'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  {joinRequests.length} Total
                </span>
              </div>

              {joinRequests.length === 0 ? (
                <div className="text-center py-12 p-6">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No join requests found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {canManageTeams
                      ? 'When employees submit join requests for teams, they will appear here for manager review.'
                      : 'You have not submitted any join requests yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                        <th className="px-4 py-3">Team Name</th>
                        <th className="px-4 py-3">Requester</th>
                        <th className="px-4 py-3">Motivation / Reason</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Reviewed By</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {joinRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {req.team_name}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{req.user_name}</div>
                            <div className="text-[11px] text-slate-400">{req.user_email}</div>
                          </td>
                          <td className="px-4 py-3 max-w-xs text-slate-600">
                            {req.reason ? (
                              <span className="italic">"{req.reason}"</span>
                            ) : (
                              <span className="text-slate-400">No reason specified</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono">
                            {formatLocalDate(req.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {req.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {req.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Declined
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {req.reviewed_by_name ? (
                              <div>
                                <span className="font-medium text-slate-700">{req.reviewed_by_name}</span>
                                {req.response_note && (
                                  <div className="text-[11px] text-slate-500 italic mt-0.5">"{req.response_note}"</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {canManageTeams && req.status === 'pending' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenReviewModal(req, 'approve')}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold shadow-xs transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenReviewModal(req, 'reject')}
                                  className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-xs font-semibold shadow-xs transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : req.status === 'pending' && req.user_id === user?.id ? (
                              <button
                                onClick={() => handleCancelJoinRequest(req.id)}
                                className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline"
                              >
                                Cancel Request
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: REQUEST TO JOIN TEAM */}
      {joinModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Request to Join Team</h3>
              </div>
              <button
                onClick={() => setJoinModalTeam(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitJoinRequest} className="p-5 space-y-4">
              <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3.5">
                <h4 className="font-bold text-blue-950 text-sm">{joinModalTeam.name}</h4>
                <p className="text-xs text-blue-800/80 mt-1">
                  {joinModalTeam.description || 'No description provided.'}
                </p>
                <div className="mt-2 text-[11px] text-blue-600 font-medium">
                  {joinModalTeam.members?.length || 0} active members
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivation / Note to Manager (Optional)
                </label>
                <textarea
                  rows={3}
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder="Explain why you would like to join this squad, your expertise, or project alignment..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalTeam(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingJoin ? 'Sending...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW JOIN REQUEST (MANAGER / ADMIN) */}
      {reviewModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  reviewAction === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {reviewAction === 'approve' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {reviewAction === 'approve' ? 'Approve Join Request' : 'Decline Join Request'}
                </h3>
              </div>
              <button
                onClick={() => setReviewModalRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div><strong className="text-slate-900">Requester:</strong> {reviewModalRequest.user_name} ({reviewModalRequest.user_email})</div>
                <div><strong className="text-slate-900">Target Team:</strong> {reviewModalRequest.team_name}</div>
                {reviewModalRequest.reason && (
                  <div><strong className="text-slate-900">Motivation:</strong> "{reviewModalRequest.reason}"</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Feedback / Welcome Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={reviewAction === 'approve' ? 'Welcome note or initial assignment details...' : 'Reason for declining...'}
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewAction === 'approve' ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>{submittingReview ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW TEAM MEMBERS ROSTER */}
      {selectedTeamRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  {selectedTeamRoster.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTeamRoster.description || 'No description provided.'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeamRoster(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Add Member Form (Admin/Manager) */}
              {canManageTeams && (
                <form onSubmit={handleAddMember} className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-blue-950">Add Member to Team</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedUserIdToAdd}
                      onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">Select an employee...</option>
                      {allUsers
                        .filter((u) => !selectedTeamRoster.members?.some((m) => m.user_id === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.profile?.full_name || u.email} ({u.role?.name || 'User'})
                          </option>
                        ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedUserIdToAdd || addingMember}
                      className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{addingMember ? 'Adding...' : 'Add'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Team Members ({selectedTeamRoster.members?.length || 0})
                </h4>

                {(!selectedTeamRoster.members || selectedTeamRoster.members.length === 0) ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No members assigned to this team.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedTeamRoster.members.map((m) => (
                      <div key={m.user_id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {m.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              {m.full_name}
                              <RoleBadge roleCode={m.role_code} />
                            </div>
                            <div className="text-[11px] text-slate-400">{m.email}</div>
                          </div>
                        </div>

                        {canManageTeams && (
                          <button
                            onClick={() => handleRemoveMember(selectedTeamRoster.id, m.user_id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedTeamRoster(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE TEAM (MANAGER / ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Create New Team</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="e.g. Cloud Infrastructure & SRE"
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Mission, domain boundaries, and technical scope..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
