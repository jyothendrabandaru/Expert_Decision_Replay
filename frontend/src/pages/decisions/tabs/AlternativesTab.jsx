import React, { useState, useEffect } from 'react';
import { Plus, Check, CheckCircle2, Trash2, Save, Radio, Sparkles, Award, Layers } from 'lucide-react';

export const AlternativesTab = ({
  decision,
  canEdit,
  setShowAddAltModal,
  handleSelectAlternative,
  handleDeleteAlternative,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState(decision.selected_alternative_id || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedChoiceId(decision.selected_alternative_id || null);
  }, [decision.selected_alternative_id]);

  const hasUnsavedChange = selectedChoiceId && selectedChoiceId !== decision.selected_alternative_id;

  const handleSaveChoice = async (altId) => {
    const targetId = altId || selectedChoiceId;
    if (!targetId) return;
    setIsSaving(true);
    try {
      await handleSelectAlternative(targetId);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Candidate Alternative Solutions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record, evaluate, score, and designate the selected architecture proposal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <>
              {hasUnsavedChange && (
                <button
                  onClick={() => handleSaveChoice(selectedChoiceId)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 animate-pulse disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Choice...' : 'Save Selected Option'}</span>
                </button>
              )}

              <button
                onClick={() => setShowAddAltModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Alternative</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alternative Cards Grid */}
      {(!decision.alternatives || decision.alternatives.length === 0) ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No alternatives configured yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add 2 or more candidate solutions to perform multi-criteria trade-off scoring and determine the optimal architecture decision.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowAddAltModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate Option</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decision.alternatives?.map((alt) => {
            const isSavedSelected = alt.id === decision.selected_alternative_id;
            const isLocallySelected = alt.id === selectedChoiceId;

            let cardBorder = 'border-slate-200 hover:border-slate-300';
            let cardBg = 'bg-white';
            if (isSavedSelected) {
              cardBorder = 'border-emerald-500 ring-2 ring-emerald-500/20';
              cardBg = 'bg-emerald-50/15';
            } else if (isLocallySelected) {
              cardBorder = 'border-blue-500 ring-2 ring-blue-500/20';
              cardBg = 'bg-blue-50/20';
            }

            return (
              <div
                key={alt.id}
                className={`${cardBg} rounded-2xl border p-6 flex flex-col justify-between transition-all shadow-xs ${cardBorder} relative overflow-hidden`}
              >
                {/* Top Corner Ribbon for Selected */}
                {isSavedSelected && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9.5px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Selected Solution</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2 pr-16">
                    <div className="flex items-center gap-2.5">
                      {canEdit && (
                        <input
                          type="radio"
                          name="selectedAlternative"
                          checked={isLocallySelected}
                          onChange={() => setSelectedChoiceId(alt.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="Select this candidate option"
                        />
                      )}
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{alt.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line min-h-[60px]">
                    {alt.description || 'No detailed description provided.'}
                  </p>

                  {/* Score Pod */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Weighted Score</span>
                      <span className="text-[10px] text-slate-400">Multi-criteria aggregate</span>
                    </div>
                    <div className="text-right">
                      {alt.total_score !== null && alt.total_score !== undefined ? (
                        <span className="text-lg font-black text-blue-600">
                          {alt.total_score} <span className="text-xs font-medium text-slate-400">/ 100</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Unscored</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {canEdit ? (
                    isSavedSelected ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saved Selection</span>
                      </span>
                    ) : isLocallySelected ? (
                      <button
                        onClick={() => handleSaveChoice(alt.id)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save this Option'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedChoiceId(alt.id);
                          handleSaveChoice(alt.id);
                        }}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Choose & Save</span>
                      </button>
                    )
                  ) : (
                    isSavedSelected ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Selected Choice</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Candidate option</span>
                    )
                  )}

                  {canEdit && (
                    <button
                      onClick={() => handleDeleteAlternative(alt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete alternative"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
