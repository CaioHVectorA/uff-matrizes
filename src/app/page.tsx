'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Upload,
  CheckCircle2,
  Clock,
  Unlock,
  Lock,
  AlertCircle,
  BarChart3,
  Search,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Database,
} from 'lucide-react';
import { SubjectAnalysisItem, StudentProgressSummary, DisplaySubjectStatus } from '@/lib/analytics/matrix-analyzer';
import { MatrixRawData } from '@/lib/scraper/uff-scraper';

const STATUS_CONFIG: Record<
  DisplaySubjectStatus,
  { label: string; badge: string; border: string; bg: string; text: string; icon: React.ReactNode }
> = {
  COMPLETED: {
    label: 'Concluída',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/40 hover:border-emerald-500/80',
    bg: 'bg-emerald-950/20',
    text: 'text-emerald-300',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  IN_PROGRESS: {
    label: 'Em Andamento',
    badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    border: 'border-sky-500/40 hover:border-sky-500/80',
    bg: 'bg-sky-950/20',
    text: 'text-sky-300',
    icon: <Clock className="w-4 h-4 text-sky-400" />,
  },
  UNLOCKED: {
    label: 'Liberada para Cursar',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/40 hover:border-amber-500/80',
    bg: 'bg-amber-950/20',
    text: 'text-amber-300',
    icon: <Unlock className="w-4 h-4 text-amber-400" />,
  },
  BLOCKED: {
    label: 'Bloqueada (Pré-requisitos)',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    border: 'border-rose-500/40 hover:border-rose-500/80',
    bg: 'bg-rose-950/20',
    text: 'text-rose-300',
    icon: <Lock className="w-4 h-4 text-rose-400" />,
  },
  PENDING: {
    label: 'Pendente',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    border: 'border-slate-700 hover:border-slate-500',
    bg: 'bg-slate-900/40',
    text: 'text-slate-300',
    icon: <AlertCircle className="w-4 h-4 text-slate-400" />,
  },
};

export default function Home() {
  const [selectedCourse, setSelectedCourse] = useState('ciencia-da-computacao');
  const [transcriptText, setTranscriptText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [customHtml, setCustomHtml] = useState('');
  const [useCustomMatrix, setUseCustomMatrix] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<{
    summary: StudentProgressSummary;
    matrix: MatrixRawData;
  } | null>(null);

  // Filter and Modal States
  const [selectedSubject, setSelectedSubject] = useState<SubjectAnalysisItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (transcriptText) {
        formData.append('text', transcriptText);
      }
      formData.append('course', selectedCourse);

      if (useCustomMatrix && customHtml) {
        formData.append('customMatrix', customHtml);
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao analisar o histórico escolar.');
      }

      setAnalysisResult({
        summary: data.analysis,
        matrix: data.matrix,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillSampleTranscript = () => {
    setTranscriptText(`UNIVERSIDADE FEDERAL FLUMINENSE
HISTÓRICO ESCOLAR
Nome: Gabriel Santos
Matrícula: 122083042
Curso: Ciência da Computação
CR: 8.4

TCC00288 PROGRAMAÇÃO DE COMPUTADORES I 60 9.0 2022/1 Aprovado
GAN00021 CÁLCULO DIFERENCIAL E INTEGRAL I 90 8.5 2022/1 Aprovado por Média
GAN00007 ÁLGEBRA LINEAR I 60 7.5 2022/1 Aprovado
TCC00287 FUNDAMENTOS DE CIÊNCIA DA COMPUTAÇÃO 60 8.0 2022/1 Aprovado
GET00118 ESTATÍSTICA E PROBABILIDADE I 60 7.0 2022/1 Aprovado

TCC00289 PROGRAMAÇÃO DE COMPUTADORES II 60 8.8 2022/2 Aprovado
TCC00290 ESTRUTURA DE DADOS 60 8.2 2022/2 Aprovado
GAN00022 CÁLCULO DIFERENCIAL E INTEGRAL II 90 6.5 2022/2 Aprovado
TCC00291 MATEMÁTICA DISCRETA 60 7.5 2022/2 Aprovado
TCC00292 CIRCUITOS LÓGICOS 60 8.0 2022/2 Aprovado

TCC00293 ANÁLISE DE ALGORITMOS 60 -- 2023/1 Inscrito
TCC00294 ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES 60 -- 2023/1 Inscrito
TCC00295 ENGENHARIA DE SOFTWARE I 60 -- 2023/1 Inscrito
TCC00296 LINGUAGENS DE PROGRAMAÇÃO 60 -- 2023/1 Inscrito
GAN00023 CÁLCULO NUMÉRICO 60 7.0 2023/1 Aprovado
`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-sky-400 p-2 rounded-xl text-slate-950 shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                UFF Matriz & Histórico
              </h1>
              <p className="text-xs text-slate-400">
                Visualizador e Mapeador de Posição Acadêmica
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-3.5 h-3.5 mr-1" /> Matrizes Estáticas em JSON
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!analysisResult ? (
          /* Input Upload Form View */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Análise Inteligente da sua Posição no Curso
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
                Suba seu Histórico Escolar da UFF para comparar diretamente com a Matriz Curricular Estática do repositório, entender matérias concluídas, matérias liberadas para inscrição e pendências.
              </p>
            </div>

            <form onSubmit={handleAnalyze} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
              {/* Course Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  1. Selecione a Matriz Curricular do seu Curso (Estática)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'ciencia-da-computacao', label: 'Ciência da Computação', campus: 'Niterói' },
                    { id: 'sistemas-de-informacao', label: 'Sistemas de Informação', campus: 'Niterói' },
                    { id: 'engenharia-de-software', label: 'Engenharia de Software', campus: 'Rio das Ostras' },
                    { id: 'engenharia-eletrica', label: 'Engenharia Elétrica', campus: 'Niterói' },
                    { id: 'engenharia-de-telecomunicacoes', label: 'Eng. Telecomunicações', campus: 'Niterói' },
                    { id: 'ciencia-de-dados', label: 'Ciência de Dados', campus: 'Niterói' },
                    { id: 'engenharia-de-producao', label: 'Engenharia de Produção', campus: 'Niterói' },
                  ].map(course => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourse(course.id);
                        setUseCustomMatrix(false);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        selectedCourse === course.id && !useCustomMatrix
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-medium text-sm">{course.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{course.campus}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Matrix Toggle */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setUseCustomMatrix(!useCustomMatrix)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${useCustomMatrix ? 'rotate-180' : ''}`} />
                  <span>Substituir matriz por JSON ou HTML customizado</span>
                </button>

                {useCustomMatrix && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Cole o HTML ou JSON da Matriz Curricular (opcional):
                    </label>
                    <textarea
                      value={customHtml}
                      onChange={e => setCustomHtml(e.target.value)}
                      placeholder="<table... </table> ou objeto JSON com array de disciplinas..."
                      className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Upload PDF or Paste Text */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <label className="block text-sm font-semibold text-slate-200">
                  2. Suba seu Histórico Escolar (PDF ou Texto)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PDF Upload Box */}
                  <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center bg-slate-950/40 transition-colors relative flex flex-col items-center justify-center min-h-[160px]">
                    <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-xs font-medium text-slate-300">
                      {file ? file.name : 'Clique para enviar PDF do Histórico UFF'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      (Suporta formato original emitido pelo idUFF / SIGA)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,text/plain"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Text Fallback Box */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Ou cole o texto do Histórico:</span>
                      <button
                        type="button"
                        onClick={fillSampleTranscript}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Usar exemplo de teste
                      </button>
                    </div>
                    <textarea
                      value={transcriptText}
                      onChange={e => setTranscriptText(e.target.value)}
                      placeholder="Cole aqui as linhas com códigos (ex: TCC00288 PROGRAMAÇÃO I 60 9.0 Aprovado)..."
                      className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-sky-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando e mapeando matriz...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    <span>Gerar Mapeamento & Visualizar Matriz</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard & Matrix Visualizer View */
          <div className="space-y-8 animate-fadeIn">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-white">
                    {analysisResult.summary.studentName || 'Estudante UFF'}
                  </h2>
                  {analysisResult.summary.registration && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Matrícula: {analysisResult.summary.registration}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Curso: <span className="text-slate-200 font-medium">{analysisResult.summary.courseName}</span> | Matriz: <span className="text-slate-200 font-medium">{analysisResult.matrix.matrixCode}</span>
                </p>
              </div>

              <button
                onClick={() => setAnalysisResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Analisar Outro Histórico</span>
              </button>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Progresso Total</span>
                <div className="text-2xl font-bold text-emerald-400">
                  {analysisResult.summary.overallCompletionPercentage}%
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${analysisResult.summary.overallCompletionPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {analysisResult.summary.totalCompletedHours} de {analysisResult.summary.totalMatrixHours} horas
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-medium">CR / Coeficiente</span>
                <div className="text-2xl font-bold text-sky-400">
                  {analysisResult.summary.cr !== undefined ? analysisResult.summary.cr.toFixed(2) : 'N/A'}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Rendimento acumulado
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Período Estimado</span>
                <div className="text-2xl font-bold text-indigo-400">
                  {analysisResult.summary.estimatedCurrentPeriod}º Período
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Etapa com pendências obrigatórias
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Matérias Liberadas</span>
                <div className="text-2xl font-bold text-amber-400">
                  {analysisResult.summary.unlockedSubjectsCount}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Prontas para cursar no próximo semestre
                </span>
              </div>
            </div>

            {/* Next Recommended Subjects Banner */}
            {analysisResult.summary.nextRecommendedSubjects.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-sm text-slate-100">
                    Recomendação de Inscrição para o Próximo Semestre
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {analysisResult.summary.nextRecommendedSubjects.slice(0, 6).map(sub => (
                    <div
                      key={sub.code}
                      onClick={() => setSelectedSubject(sub)}
                      className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all flex items-start justify-between"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-amber-300">{sub.code}</div>
                        <div className="text-xs font-medium text-slate-200 line-clamp-1">{sub.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.period}º Período • {sub.workload}h</div>
                      </div>
                      <Unlock className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: 'Todas' },
                  { key: 'COMPLETED', label: 'Concluídas' },
                  { key: 'IN_PROGRESS', label: 'Em Andamento' },
                  { key: 'UNLOCKED', label: 'Liberadas' },
                  { key: 'BLOCKED', label: 'Bloqueadas' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === f.key
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar matéria ou código..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Interactive Matrix Grid (Per Semester) */}
            <div className="space-y-6">
              {analysisResult.summary.periodGroups.map(group => {
                const filteredSubjects = group.subjects.filter(sub => {
                  if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
                  if (
                    searchQuery &&
                    !sub.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !sub.code.toLowerCase().includes(searchQuery.toLowerCase())
                  ) {
                    return false;
                  }
                  return true;
                });

                if (filteredSubjects.length === 0) return null;

                return (
                  <div key={group.period} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <h3 className="font-bold text-sm text-slate-200">{group.title}</h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        {group.completedHours}h de {group.totalHours}h concluídas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredSubjects.map(sub => {
                        const cfg = STATUS_CONFIG[sub.status];
                        return (
                          <div
                            key={sub.code}
                            onClick={() => setSelectedSubject(sub)}
                            className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg} cursor-pointer transition-all space-y-2 relative group hover:scale-[1.01]`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-mono text-xs font-bold text-slate-300">
                                {sub.code}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                            </div>

                            <h4 className="font-medium text-xs text-slate-100 line-clamp-2 min-h-[32px]">
                              {sub.name}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                              <span>{sub.workload}h • {sub.type === 'OBRIGATORIA' ? 'Obrigatória' : 'Optativa'}</span>
                              {sub.grade !== undefined && (
                                <span className="font-mono text-emerald-400 font-bold">
                                  Nota: {sub.grade}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Subject Detail Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedSubject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-mono p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-indigo-400">
                {selectedSubject.code}
              </span>
              <h3 className="text-lg font-bold text-white">{selectedSubject.name}</h3>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CONFIG[selectedSubject.status].badge}`}>
                {STATUS_CONFIG[selectedSubject.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Carga Horária</span>
                <span className="font-semibold text-slate-200">{selectedSubject.workload} horas</span>
              </div>
              <div>
                <span className="text-slate-500 block">Período Sugerido</span>
                <span className="font-semibold text-slate-200">{selectedSubject.period === 0 ? 'Optativa' : `${selectedSubject.period}º Período`}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tipo</span>
                <span className="font-semibold text-slate-200">{selectedSubject.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nota no Histórico</span>
                <span className="font-semibold text-slate-200">{selectedSubject.grade !== undefined ? selectedSubject.grade : 'N/A'}</span>
              </div>
            </div>

            {/* Prerequisites Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Pré-requisitos Exigidos:</h4>
              {selectedSubject.prerequisites.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhum pré-requisito necessário.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedSubject.prerequisites.map(pCode => {
                    const isMissing = selectedSubject.missingPrerequisites.includes(pCode);
                    return (
                      <div
                        key={pCode}
                        className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between border ${
                          isMissing
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <span>{pCode}</span>
                        <span>{isMissing ? '❌ Não Concluído' : '✓ Concluído'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSubject(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
