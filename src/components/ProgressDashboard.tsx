'use client';

import React from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  Unlock,
  Lock,
  Calendar,
  Sparkles,
  ArrowRight,
  Layers,
  BookOpen,
  ArrowLeftRight
} from 'lucide-react';
import { StudentProgressSummary, SubjectAnalysisItem } from '@/lib/analytics/matrix-analyzer';

interface ProgressDashboardProps {
  summary: StudentProgressSummary;
  onSelectSubject: (subject: SubjectAnalysisItem) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  selectedEmphasis?: string;
  onSelectEmphasis?: (emphasis: string) => void;
  onOpenEquivalenceModal?: () => void;
}

export default function ProgressDashboard({
  summary,
  onSelectSubject,
  statusFilter,
  setStatusFilter,
  selectedEmphasis = 'ALL',
  onSelectEmphasis,
  onOpenEquivalenceModal,
}: ProgressDashboardProps) {
  const activeEquivCount = summary.activeEquivalences?.length || 0;
  const detectedCandCount = summary.detectedEquivalenceCandidates?.length || 0;

  return (
    <div className="space-y-6">
      {/* Top Academic Identity & Overall Progress Banner */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Student Info */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h2 className="text-xl font-bold text-slate-100">
                  {summary.studentName || 'Estudante UFF'}
                </h2>
                {summary.admissionPeriod && (
                  <span className="text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-lg">
                    Ingresso: {summary.admissionPeriod}
                  </span>
                )}
                {summary.emphasis && (
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                    Ênfase: {summary.emphasis}
                  </span>
                )}
                {summary.qualification && (
                  <span className="text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
                    Habilitação: {summary.qualification}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  Curso: <strong className="text-slate-200">{summary.courseName || 'Engenharia Elétrica'}</strong>
                </span>
                {summary.registration && (
                  <span>
                    Matrícula: <strong className="text-slate-200 font-mono">{summary.registration}</strong>
                  </span>
                )}
                {summary.curriculumCode && (
                  <span>
                    Currículo: <strong className="text-slate-200 font-mono">{summary.curriculumCode}</strong>
                  </span>
                )}
                {summary.cpf && (
                  <span>
                    CPF: <strong className="text-slate-200 font-mono">{summary.cpf}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CR & Estimated Semester Badges & Equivalence Shortcut */}
          <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
            {summary.cr !== undefined && (
              <div className="px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Coeficiente (CR)
                </span>
                <span className="text-xl font-mono font-black text-indigo-400">
                  {summary.cr.toFixed(2)}
                </span>
              </div>
            )}

            <div className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Período Estimado
              </span>
              <span className="text-xl font-mono font-black text-amber-400">
                {summary.estimatedCurrentPeriod}º
              </span>
            </div>

            {onOpenEquivalenceModal && (detectedCandCount > 0 || activeEquivCount > 0) && (
              <button
                type="button"
                onClick={onOpenEquivalenceModal}
                className="px-4 py-2.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-2xl text-center transition-all hover:scale-105 flex flex-col items-center justify-center cursor-pointer shadow-md shadow-teal-950/40"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
                  <span>Equivalências</span>
                </div>
                <span className="text-xs font-bold font-mono text-teal-200 mt-0.5">
                  {activeEquivCount > 0 ? `${activeEquivCount} Ativa(s)` : `${detectedCandCount} Sugestão(ões)`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Integralização Curricular Geral
            </span>
            <span className="font-mono font-bold text-indigo-400 text-sm">
              {summary.overallCompletionPercentage}% ({summary.totalCompletedHours}h de {summary.totalMatrixHours}h)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.min(100, summary.overallCompletionPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Track / Emphasis Filter selector if available */}
      {summary.availableEmphases && summary.availableEmphases.length > 0 && onSelectEmphasis && (
        <div className="p-4 bg-slate-900/80 border border-indigo-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Trilhas & Ênfases do Curso:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectEmphasis('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedEmphasis === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas as Trilhas ({summary.availableEmphases.length})
            </button>
            {summary.availableEmphases.map(emp => (
              <button
                key={emp}
                onClick={() => onSelectEmphasis(emp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedEmphasis === emp
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {emp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workload Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Mandatory */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Obrigatórias</span>
          <span className="text-lg font-bold font-mono text-slate-100">
            {summary.mandatoryCompletedHours}h
            <span className="text-xs text-slate-500 font-normal"> / {summary.mandatoryTotalHours}h</span>
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${summary.mandatoryCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* Choice (Obrigatórias de Escolha) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Escolha</span>
          <span className="text-lg font-bold font-mono text-slate-100">
            {summary.choiceCompletedHours}h
            <span className="text-xs text-slate-500 font-normal"> / {summary.choiceTotalHours}h</span>
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${summary.choiceCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* Electives / Optativas */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Optativas</span>
          <span className="text-lg font-bold font-mono text-slate-100">
            {summary.electiveCompletedHours}h
            <span className="text-xs text-slate-500 font-normal"> / {summary.electiveTotalHours}h</span>
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${summary.electiveCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* Emphasis */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Opt. de Ênfase</span>
          <span className="text-lg font-bold font-mono text-slate-100">
            {summary.emphasisCompletedHours}h
            <span className="text-xs text-slate-500 font-normal"> / {summary.emphasisTotalHours || 0}h</span>
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${summary.emphasisCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* Complementary Activities (AC) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Ativ. Compl. (AC)</span>
          <span className="text-lg font-bold font-mono text-slate-100">
            {summary.complementaryCompletedHours}h
            <span className="text-xs text-slate-500 font-normal"> / {summary.complementaryTotalHours}h</span>
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${summary.complementaryCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* In Progress Hours */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Em Andamento</span>
          <span className="text-lg font-bold font-mono text-sky-400">
            {summary.inProgressHours}h
          </span>
          <span className="text-[10px] text-slate-500 block mt-2">
            {summary.inProgressSubjectsCount} disciplinas cursando
          </span>
        </div>
      </div>

      {/* Interactive Status Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
            statusFilter === 'ALL'
              ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            <BookOpen className="w-4 h-4" />
            <span>Todas as Matérias</span>
          </div>
          <span className="text-xl font-bold font-mono mt-1 text-slate-100">
            {summary.completedSubjectsCount + summary.inProgressSubjectsCount + summary.unlockedSubjectsCount + summary.blockedSubjectsCount + summary.pendingSubjectsCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-600/20 border-emerald-500/60 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluídas</span>
          </div>
          <span className="text-xl font-bold font-mono mt-1 text-emerald-400">
            {summary.completedSubjectsCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-sky-600/20 border-sky-500/60 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <Clock className="w-4 h-4" />
            <span>Em Andamento</span>
          </div>
          <span className="text-xl font-bold font-mono mt-1 text-sky-400">
            {summary.inProgressSubjectsCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('UNLOCKED')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
            statusFilter === 'UNLOCKED'
              ? 'bg-amber-600/20 border-amber-500/60 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Unlock className="w-4 h-4" />
            <span>Liberadas</span>
          </div>
          <span className="text-xl font-bold font-mono mt-1 text-amber-400">
            {summary.unlockedSubjectsCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('BLOCKED')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
            statusFilter === 'BLOCKED'
              ? 'bg-rose-600/20 border-rose-500/60 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
            <Lock className="w-4 h-4" />
            <span>Bloqueadas</span>
          </div>
          <span className="text-xl font-bold font-mono mt-1 text-rose-400">
            {summary.blockedSubjectsCount}
          </span>
        </button>
      </div>

      {/* Priority Recommendations for Enrollment */}
      {summary.nextRecommendedSubjects.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 rounded-2xl border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-100">
                Disciplinas Prioritárias Recomendadas para Inscrição
              </h3>
            </div>
            <span className="text-xs text-amber-300/80 font-medium">
              Ordenadas por período e impacto no desbloqueio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {summary.nextRecommendedSubjects.slice(0, 4).map(subj => (
              <div
                key={subj.code}
                onClick={() => onSelectSubject(subj)}
                className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-amber-500/20 hover:border-amber-400/60 rounded-xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-amber-300">{subj.code}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{subj.period}º Período</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{subj.name}</h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 text-[10px] text-slate-400">
                  <span>{subj.workload}h</span>
                  <span className="text-amber-400 font-medium">
                    Desbloqueia +{subj.unlocksNext.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
