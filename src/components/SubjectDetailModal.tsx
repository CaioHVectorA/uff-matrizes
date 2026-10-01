'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  GraduationCap,
  Calendar,
  Layers
} from 'lucide-react';
import { SubjectAnalysisItem, DisplaySubjectStatus } from '@/lib/analytics/matrix-analyzer';

interface SubjectDetailModalProps {
  subject: SubjectAnalysisItem | null;
  onClose: () => void;
  allSubjectsMap: Map<string, SubjectAnalysisItem>;
  onSelectRelated: (subject: SubjectAnalysisItem) => void;
}

export default function SubjectDetailModal({
  subject,
  onClose,
  allSubjectsMap,
  onSelectRelated,
}: SubjectDetailModalProps) {
  if (!subject) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono font-bold text-sm text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                {subject.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {subject.period === 0 ? 'Não Periodizada' : `${subject.period}º Período`}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                  subject.type === 'OBRIGATORIA'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : subject.type === 'ESCOLHA'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : subject.type === 'OPTATIVA_ENFASE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : subject.type === 'COMPLEMENTAR'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {subject.type}
              </span>
              {subject.emphasis && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                  Trilha / Ênfase: {subject.emphasis}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-100 leading-snug">
              {subject.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {/* Status & Grades Banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  subject.status === 'COMPLETED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : subject.status === 'IN_PROGRESS'
                    ? 'bg-sky-500/20 text-sky-400'
                    : subject.status === 'UNLOCKED'
                    ? 'bg-amber-500/20 text-amber-400'
                    : subject.status === 'BLOCKED'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-700/30 text-slate-400'
                }`}
              >
                {subject.status === 'COMPLETED' && <CheckCircle2 className="w-6 h-6" />}
                {subject.status === 'IN_PROGRESS' && <Clock className="w-6 h-6 animate-pulse" />}
                {subject.status === 'UNLOCKED' && <Unlock className="w-6 h-6" />}
                {subject.status === 'BLOCKED' && <Lock className="w-6 h-6" />}
                {subject.status === 'PENDING' && <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Status no Histórico
                </span>
                <span className="text-base font-bold text-slate-100">
                  {subject.status === 'COMPLETED'
                    ? 'Disciplina Concluída'
                    : subject.status === 'IN_PROGRESS'
                    ? 'Em Andamento / Cursando'
                    : subject.status === 'UNLOCKED'
                    ? 'Liberada para Cursar'
                    : subject.status === 'BLOCKED'
                    ? 'Bloqueada por Pré-requisitos'
                    : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Grades or details if available */}
            <div className="flex items-center gap-4">
              {subject.gradeRaw && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Resultado</span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {subject.gradeRaw}
                  </span>
                </div>
              )}
              {subject.periodSemester && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Semestre Cursado</span>
                  <span className="text-sm font-mono font-medium text-slate-200">
                    {subject.periodSemester}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Workload Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Carga Horária
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total</span>
                <span className="text-base font-bold font-mono text-slate-100">{subject.workload}h</span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tipo</span>
                <span className="text-sm font-bold text-slate-200">{subject.type}</span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Período Ideal</span>
                <span className="text-sm font-bold text-slate-200">
                  {subject.period === 0 ? 'Livre' : `${subject.period}º`}
                </span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">CH Mínima Pré-Req</span>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {subject.chPreReq ? `${subject.chPreReq}h` : 'Nenhum'}
                </span>
              </div>
            </div>
          </div>

          {/* Prerequisites Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Pré-requisitos Necessários ({subject.prerequisites.length})
            </h4>

            {subject.prerequisites.length === 0 && !subject.chPreReq && !subject.specialPrereq ? (
              <p className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                ✨ Esta disciplina não possui pré-requisitos!
              </p>
            ) : (
              <div className="space-y-2">
                {subject.specialPrereq && (
                  <div className="p-2.5 rounded-lg border bg-amber-950/20 border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Requisito especial: <strong>{subject.specialPrereq}</strong></span>
                  </div>
                )}
                {subject.chPreReq && (
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    subject.isChPreReqMissing
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <span>Carga horária acumulada mínima: <strong>{subject.chPreReq}h</strong></span>
                    <span>{subject.isChPreReqMissing ? '❌ Faltam horas' : '✅ Horas atingidas'}</span>
                  </div>
                )}
                {subject.prerequisites.map(pCode => {
                  const upper = pCode.toUpperCase();
                  const prereqSubject = allSubjectsMap.get(upper);
                  const isCompleted = !subject.missingPrerequisites.includes(pCode);

                  return (
                    <div
                      key={pCode}
                      onClick={() => prereqSubject && onSelectRelated(prereqSubject)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        prereqSubject ? 'cursor-pointer hover:scale-[1.01]' : ''
                      } ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-mono font-bold text-xs">{upper}</span>
                          <span className="text-xs text-slate-300 ml-2">
                            {prereqSubject?.name || 'Disciplina'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {isCompleted ? (
                          <span className="font-mono text-emerald-400">
                            {prereqSubject?.gradeRaw ? `Nota: ${prereqSubject.gradeRaw}` : 'Concluída'}
                          </span>
                        ) : (
                          <span className="font-semibold text-rose-400">Pendente</span>
                        )}
                        {prereqSubject && <ArrowRight className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Co-requisites Section if any */}
          {subject.corequisites && subject.corequisites.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                Co-requisitos ({subject.corequisites.length})
              </h4>
              <div className="space-y-2">
                {subject.corequisites.map(cCode => {
                  const upper = cCode.toUpperCase();
                  const coreqSubject = allSubjectsMap.get(upper);

                  return (
                    <div
                      key={cCode}
                      onClick={() => coreqSubject && onSelectRelated(coreqSubject)}
                      className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-center justify-between cursor-pointer hover:bg-sky-900/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-sky-300">{upper}</span>
                        <span className="text-xs text-slate-300">{coreqSubject?.name || 'Co-requisito'}</span>
                      </div>
                      <span className="text-xs text-sky-400 font-medium">Cursar junto ou antes</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unlocks Next Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Unlock className="w-4 h-4 text-indigo-400" />
              Desbloqueia a Seguir ({subject.unlocksNext.length})
            </h4>

            {subject.unlocksNext.length === 0 ? (
              <p className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                Esta disciplina não é pré-requisito direto de outras matérias.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subject.unlocksNext.map(uCode => {
                  const upper = uCode.toUpperCase();
                  const targetSubject = allSubjectsMap.get(upper);

                  return (
                    <div
                      key={uCode}
                      onClick={() => targetSubject && onSelectRelated(targetSubject)}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono font-bold text-xs text-indigo-400 block">{upper}</span>
                        <span className="text-xs text-slate-300 line-clamp-1">
                          {targetSubject?.name || 'Disciplina'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
