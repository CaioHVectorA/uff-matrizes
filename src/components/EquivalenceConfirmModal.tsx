'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  BookOpen,
  Check,
  Layers,
  HelpCircle
} from 'lucide-react';
import { DetectedEquivalenceCandidate } from '@/lib/analytics/matrix-analyzer';

interface EquivalenceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: DetectedEquivalenceCandidate[];
  onConfirm: (selectedMappings: Record<string, string>) => void;
  currentEquivalences?: Record<string, string>;
}

export default function EquivalenceConfirmModal({
  isOpen,
  onClose,
  candidates,
  onConfirm,
  currentEquivalences = {},
}: EquivalenceConfirmModalProps) {
  // Key format: `${matrixCode}::${transcriptCode}`
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Initialize selected keys when candidates or modal opens
  useEffect(() => {
    if (isOpen && candidates.length > 0) {
      const initial = new Set<string>();
      candidates.forEach(c => {
        const key = `${c.matrixCode}::${c.transcriptCode}`;
        // If already in currentEquivalences or by default true for high score matches
        if (currentEquivalences[c.matrixCode] === c.transcriptCode || !currentEquivalences[c.matrixCode]) {
          initial.add(key);
        }
      });
      setSelectedKeys(initial);
    }
  }, [isOpen, candidates, currentEquivalences]);

  if (!isOpen || candidates.length === 0) return null;

  const toggleKey = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  };

  const selectAll = () => {
    const all = new Set(candidates.map(c => `${c.matrixCode}::${c.transcriptCode}`));
    setSelectedKeys(all);
  };

  const deselectAll = () => {
    setSelectedKeys(new Set());
  };

  const handleApply = () => {
    const mappings: Record<string, string> = { ...currentEquivalences };
    candidates.forEach(c => {
      const key = `${c.matrixCode}::${c.transcriptCode}`;
      if (selectedKeys.has(key)) {
        mappings[c.matrixCode] = c.transcriptCode;
      } else if (mappings[c.matrixCode] === c.transcriptCode) {
        delete mappings[c.matrixCode];
      }
    });
    onConfirm(mappings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-2xl shrink-0 shadow-lg shadow-teal-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-bold text-slate-100">
                  Equivalências Reconhecidas Automaticamente
                </h3>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {candidates.length} detectada{candidates.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detectamos matérias cursadas no seu histórico com códigos ou ementas equivalentes às da matriz. Marque as que você deseja abater no seu fluxo:
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Select All / Deselect All */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            <strong>{selectedKeys.size}</strong> de <strong>{candidates.length}</strong> selecionada(s)
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Selecionar Todas
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-slate-400 hover:text-slate-300 font-semibold transition-colors"
            >
              Desmarcar Todas
            </button>
          </div>
        </div>

        {/* Candidate List Body */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-sm text-slate-300">
          {candidates.map(cand => {
            const key = `${cand.matrixCode}::${cand.transcriptCode}`;
            const isChecked = selectedKeys.has(key);

            return (
              <div
                key={key}
                onClick={() => toggleKey(key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                  isChecked
                    ? 'bg-teal-950/20 border-teal-500/50 shadow-md shadow-teal-950/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Top info and checkbox */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleKey(key)}
                      onClick={e => e.stopPropagation()}
                      className="w-5 h-5 rounded border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-500"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {cand.matchReason}
                      </span>
                      {cand.matchScore && (
                        <span className="text-[11px] font-mono text-slate-400">
                          Índice de Compatibilidade: {cand.matchScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  {cand.unlocksCount > 0 && (
                    <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <Unlock className="w-3 h-3 text-amber-400" />
                      Desbloqueia +{cand.unlocksCount} matérias
                    </span>
                  )}
                </div>

                {/* Comparison Row: Matrix Subject <-> Transcript Record */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Matrix Subject */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Matéria na Matriz (A ser abatida)
                    </span>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono font-bold text-xs text-indigo-400">
                        {cand.matrixCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {cand.matrixPeriod === 0 ? 'Livre' : `${cand.matrixPeriod}º Período`} • {cand.matrixWorkload}h
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-200 line-clamp-1">
                      {cand.matrixName}
                    </h4>
                  </div>

                  {/* Transcript Record */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-teal-500/30">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                      Cursada no seu Histórico
                    </span>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono font-bold text-xs text-teal-300">
                        {cand.transcriptCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {cand.transcriptWorkload}h • Nota: <strong className="text-teal-300">{cand.transcriptGradeRaw || cand.transcriptGrade || 'Dispensa'}</strong>
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-200 line-clamp-1">
                      {cand.transcriptName}
                    </h4>
                  </div>
                </div>

                {/* Downstream Unlocks Detail if present */}
                {cand.unlocksNames.length > 0 && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-slate-500">Libera o fluxo de:</span>
                    <span className="text-slate-300 font-medium line-clamp-1">
                      {cand.unlocksNames.slice(0, 3).join(', ')}{cand.unlocksNames.length > 3 ? ` (+${cand.unlocksNames.length - 3})` : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Você também pode vincular ou desvincular equivalências a qualquer momento clicando em cada matéria.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Decidir Depois
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar e Aplicar ({selectedKeys.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
