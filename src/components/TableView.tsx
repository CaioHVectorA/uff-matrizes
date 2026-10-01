'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Unlock,
  Lock,
  AlertCircle,
  ChevronDown,
  Layers,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import {
  SubjectAnalysisItem,
  StudentProgressSummary,
  DisplaySubjectStatus
} from '@/lib/analytics/matrix-analyzer';

interface TableViewProps {
  summary: StudentProgressSummary;
  onSelectSubject: (subject: SubjectAnalysisItem) => void;
  selectedSubject: SubjectAnalysisItem | null;
  searchQuery: string;
  statusFilter: string;
}

export default function TableView({
  summary,
  onSelectSubject,
  selectedSubject,
  searchQuery,
  statusFilter,
}: TableViewProps) {
  return (
    <div className="space-y-6">
      {summary.periodGroups.map(group => {
        // Filter subjects
        const filteredSubjects = group.subjects.filter(subject => {
          const matchesSearch =
            !searchQuery ||
            subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus =
            statusFilter === 'ALL' || subject.status === statusFilter;
          return matchesSearch && matchesStatus;
        });

        if (filteredSubjects.length === 0) return null;

        const isCurrentEstPeriod = group.period === summary.estimatedCurrentPeriod;

        return (
          <div
            key={group.period}
            className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
              isCurrentEstPeriod
                ? 'bg-slate-900/90 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{group.title}</h3>
                    {isCurrentEstPeriod && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded uppercase">
                        Período Atual
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {group.completedHours} de {group.totalHours} horas concluídas
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {group.totalHours > 0 ? Math.round((group.completedHours / group.totalHours) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubjects.map(subject => {
                const isSelected = selectedSubject?.code === subject.code;

                return (
                  <div
                    key={subject.code}
                    onClick={() => onSelectSubject(subject)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg scale-[1.01]'
                        : 'bg-slate-950/50 hover:bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-indigo-300">
                          {subject.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              subject.type === 'OBRIGATORIA'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : subject.type === 'ESCOLHA'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : subject.type === 'COMPLEMENTAR'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {subject.type === 'OBRIGATORIA'
                              ? 'OB'
                              : subject.type === 'ESCOLHA'
                              ? 'E'
                              : subject.type === 'COMPLEMENTAR'
                              ? 'AC'
                              : 'OPT'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {subject.workload}h
                          </span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-xs text-slate-200 line-clamp-2 mb-2">
                        {subject.name}
                      </h4>

                      {subject.isEquivalent && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                            <ArrowLeftRight className="w-2.5 h-2.5" />
                            Eq: {subject.equivalenceInfo?.equivalentCode}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {subject.status === 'COMPLETED' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {subject.status === 'IN_PROGRESS' && (
                          <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                        )}
                        {subject.status === 'UNLOCKED' && (
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {subject.status === 'BLOCKED' && (
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        {subject.status === 'PENDING' && (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}

                        <span
                          className={`font-medium ${
                            subject.status === 'COMPLETED'
                              ? 'text-emerald-300'
                              : subject.status === 'IN_PROGRESS'
                              ? 'text-sky-300'
                              : subject.status === 'UNLOCKED'
                              ? 'text-amber-300'
                              : subject.status === 'BLOCKED'
                              ? 'text-rose-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {subject.status === 'COMPLETED'
                            ? subject.gradeRaw
                              ? `Nota ${subject.gradeRaw}`
                              : 'Concluída'
                            : subject.status === 'IN_PROGRESS'
                            ? 'Cursando'
                            : subject.status === 'UNLOCKED'
                            ? 'Liberada'
                            : subject.status === 'BLOCKED'
                            ? 'Bloqueada'
                            : 'Pendente'}
                        </span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
