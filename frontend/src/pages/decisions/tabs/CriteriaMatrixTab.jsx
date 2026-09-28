import React from 'react';
import { Plus, Check, Trash2, Lock, ShieldCheck, UserCheck, Award, SlidersHorizontal, Scale } from 'lucide-react';

export const CriteriaMatrixTab = ({
  decision,
  user,
  matrix,
  canEdit,
  editingScores,
  savingMatrix,
  setShowAddCritModal,
  handleSaveEvaluationMatrix,
  handleScoreChange,
  handleDeleteCriterion,
}) => {
  const calculateLiveScore = (altId) => {
    if (!matrix?.criteria || matrix.criteria.length === 0) return null;
    let weightedSum = 0;
    let totalWeight = 0;
    let hasAnyScore = false;

    matrix.criteria.forEach((crit) => {
      const weight = parseFloat(crit.weight) || 1.0;
      const score = editingScores[`${altId}_${crit.id}`];
      if (score !== undefined && score !== null && score !== '') {
        weightedSum += parseFloat(score) * weight;
        totalWeight += weight;
        hasAnyScore = true;
      }
    });

    if (!hasAnyScore || totalWeight <= 0) return null;
    return (weightedSum / totalWeight).toFixed(1);
  };

  const getGovernanceNotice = () => {
    if (canEdit) return null;
    const st = decision?.status;
    if (st === 'approved' || st === 'rejected' || st === 'superseded') {
      return {
        icon: Lock,
        bgColor: 'bg-slate-50 border-slate-200 text-slate-700',
        text: 'Decision Finalized & Locked: Evaluation matrix is preserved as an immutable institutional record.',
      };
    }
    if (st === 'in_approval') {
      return {
        icon: ShieldCheck,
        bgColor: 'bg-amber-50/80 border-amber-200 text-amber-800',
        text: 'In Management Approval: Evaluation criteria and scoring are locked for non-managers to prevent tampering with governance ratings.',
      };
    }
    if (st === 'in_review') {
      return {
        icon: UserCheck,
        bgColor: 'bg-blue-50/80 border-blue-200 text-blue-800',
        text: 'In Technical Peer Review: Scoring is currently restricted to designated Reviewers and Managers.',
      };
    }
    return {
      icon: Lock,
      bgColor: 'bg-slate-50 border-slate-200 text-slate-700',
      text: 'Draft Mode: Only the decision author and management team can configure evaluation criteria and ratings.',
    };
  };

  const notice = getGovernanceNotice();

  return (
    <div className="space-y-6">
      {notice && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold ${notice.bgColor} shadow-2xs`}>
          <notice.icon className="w-4 h-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Weighted Evaluation Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign dimensional criteria weights and score each candidate alternative from 0 to 100.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <>
              <button
                onClick={() => setShowAddCritModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Criterion</span>
              </button>

              <button
                onClick={handleSaveEvaluationMatrix}
                disabled={savingMatrix}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingMatrix ? 'Saving Scores...' : 'Save Matrix Scores'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Evaluation Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {(!matrix?.criteria || matrix.criteria.length === 0) ? (
          <div className="text-center py-16 p-8">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No evaluation criteria defined</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add technical, cost, security, or maintainability criteria to compare and evaluate your candidate alternatives.
            </p>
            {canEdit && (
              <button
                onClick={() => setShowAddCritModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Criterion</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th className="py-3.5 px-6 min-w-[220px]">Evaluation Criterion</th>
                  <th className="py-3.5 px-4 w-28 text-center">Weight</th>
                  {matrix?.alternatives?.map((alt) => {
                    const compScore = calculateLiveScore(alt.id) ?? alt.total_score;
                    const isWinner = alt.id === decision?.selected_alternative_id;
                    return (
                      <th key={alt.id} className={`py-3.5 px-4 text-center min-w-[170px] ${isWinner ? 'bg-emerald-50/50' : ''}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-bold text-slate-900 truncate">{alt.title}</span>
                          {isWinner && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Designated Choice" />
                          )}
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                          Composite: {compScore !== null ? `${compScore} / 100` : 'Unscored'}
                        </span>
                      </th>
                    );
                  })}
                  {canEdit && <th className="py-3.5 px-4 w-12 text-center"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix?.criteria?.map((crit) => (
                  <tr key={crit.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block text-xs">{crit.name}</span>
                      {crit.description && <span className="text-[11px] text-slate-400 block mt-0.5">{crit.description}</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        {crit.weight}x
                      </span>
                    </td>
                    {matrix.alternatives.map((alt) => {
                      const cellKey = `${alt.id}_${crit.id}`;
                      const currentVal = editingScores[cellKey] !== undefined ? editingScores[cellKey] : '';
                      const evalRecord = matrix?.evaluations?.find(
                        (e) => e.alternative_id === alt.id && e.criterion_id === crit.id
                      );
                      const isWinner = alt.id === decision?.selected_alternative_id;

                      return (
                        <td key={alt.id} className={`py-3.5 px-4 text-center ${isWinner ? 'bg-emerald-50/20' : ''}`}>
                          {canEdit ? (
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={currentVal}
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleScoreChange(alt.id, crit.id, e.target.value)}
                                className="w-20 bg-slate-50 border border-slate-200 text-center font-bold text-xs py-1.5 px-2 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {evalRecord?.evaluated_by_name && (
                                <span className="text-[9.5px] text-slate-400 mt-1 truncate max-w-[120px]">
                                  by {evalRecord.evaluated_by_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                                {currentVal !== '' && currentVal !== undefined ? currentVal : '—'}
                              </span>
                              {evalRecord?.evaluated_by_name && (
                                <span className="text-[9.5px] text-slate-400 mt-1 truncate max-w-[120px]">
                                  by {evalRecord.evaluated_by_name}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {canEdit && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteCriterion(crit.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Criterion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Composite Footer */}
                <tr className="bg-blue-50/60 font-black border-t-2 border-slate-200 text-xs">
                  <td className="py-4 px-6 text-slate-900 uppercase tracking-wider">
                    Weighted Aggregate Score
                  </td>
                  <td className="py-4 px-4 text-center text-slate-500 font-bold">100%</td>
                  {matrix?.alternatives?.map((alt) => {
                    const finalScore = calculateLiveScore(alt.id) ?? alt.total_score;
                    const isWinner = alt.id === decision?.selected_alternative_id;
                    return (
                      <td key={alt.id} className={`py-4 px-4 text-center text-sm font-black ${isWinner ? 'text-emerald-700 bg-emerald-100/50' : 'text-blue-700'}`}>
                        {finalScore !== null ? `${finalScore} / 100` : '0 / 100'}
                      </td>
                    );
                  })}
                  {canEdit && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
