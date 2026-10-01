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
  BookOpen
} from 'lucide-react';
import { StudentProgressSummary, SubjectAnalysisItem } from '@/lib/analytics/matrix-analyzer';

interface ProgressDashboardProps {
  summary: StudentProgressSummary;
  onSelectSubject: (subject: SubjectAnalysisItem) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  selectedEmphasis?: string;
  onSelectEmphasis?: (emphasis: string) => void;
}

export default function ProgressDashboard({
  summary,
  onSelectSubject,
  statusFilter,
  setStatusFilter,
  selectedEmphasis = 'ALL',
  onSelectEmphasis,
}: ProgressDashboardProps) {
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

          {/* CR & Estimated Semester Badges */}
          <div className="flex items-center gap-3 self-start lg:self-center">
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
          </div>
        </div>

        {/* Overall Hours Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Progresso Geral do Curso
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {summary.totalCompletedHours} / {summary.totalMatrixHours} horas ({summary.overallCompletionPercentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              style={{ width: `${summary.overallCompletionPercentage}%` }}
            />
          </div>

          {/* Hours Breakdown Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Obrigatórias (OB)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold font-mono text-slate-200">
                  {summary.mandatoryCompletedHours}/{summary.mandatoryTotalHours}h
                </span>
                <span className="text-[11px] font-mono text-indigo-400 font-bold">
                  {summary.mandatoryCompletionPercentage}%
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Obrig. Escolha (E)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold font-mono text-slate-200">
                  {summary.choiceCompletedHours}/{summary.choiceTotalHours}h
                </span>
                <span className="text-[11px] font-mono text-purple-400 font-bold">
                  {summary.choiceCompletionPercentage}%
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Optativas (O)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold font-mono text-slate-200">
                  {summary.electiveCompletedHours}/{summary.electiveTotalHours}h
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  {summary.electiveCompletionPercentage}%
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Ativ. Complementares (AC)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold font-mono text-slate-200">
                  {summary.complementaryCompletedHours}/{summary.complementaryTotalHours}h
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {summary.complementaryCompletionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Interactive Status Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
            statusFilter === 'ALL'
              ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400">Total de Matérias</span>
          <span className="text-xl font-bold font-mono mt-1 text-slate-100">
            {summary.completedSubjectsCount + summary.inProgressSubjectsCount + summary.unlockedSubjectsCount + summary.blockedSubjectsCount}
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
