'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  Layers,
  Table as TableIcon,
  Search,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import {
  SubjectAnalysisItem,
  StudentProgressSummary,
  analyzeStudentProgress
} from '@/lib/analytics/matrix-analyzer';
import { extractTextFromPdfFile } from '@/lib/parser/pdf-reader';
import { parseMatrixText } from '@/lib/parser/matrix-parser';
import { parseTranscriptText } from '@/lib/parser/transcript-parser';
import {
  saveAppStateToStorage,
  loadAppStateFromStorage,
  clearAppStateFromStorage
} from '@/lib/storage/app-storage';
import { SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT } from '@/lib/data/sample-data';
import { MatrixRawData } from '@/lib/scraper/uff-scraper';

import FlowchartCanvas from '@/components/FlowchartCanvas';
import SubjectDetailModal from '@/components/SubjectDetailModal';
import ProgressDashboard from '@/components/ProgressDashboard';
import UploadSection from '@/components/UploadSection';
import TableView from '@/components/TableView';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<{
    summary: StudentProgressSummary;
    matrix: MatrixRawData;
  } | null>(null);

  // UI View state: Flowchart Canvas vs Table View
  const [activeView, setActiveView] = useState<'flowchart' | 'table'>('flowchart');

  // Filter and Modal States
  const [selectedSubject, setSelectedSubject] = useState<SubjectAnalysisItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEmphasis, setSelectedEmphasis] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-restore state from localStorage on initial load or load default sample
  useEffect(() => {
    const saved = loadAppStateFromStorage();
    if (saved && saved.analysisResult && saved.matrixData) {
      setAnalysisResult({
        summary: saved.analysisResult,
        matrix: saved.matrixData,
      });
    } else {
      // Auto-load Engenharia Elétrica & Caio sample data so the canvas is immediately active!
      try {
        const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
        const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);
        const summary = analyzeStudentProgress(matrix, transcript);
        setAnalysisResult({ summary, matrix });
        saveAppStateToStorage({
          analysisResult: summary,
          matrixData: matrix,
          rawMatrixText: SAMPLE_MATRIX_TEXT,
          rawTranscriptText: SAMPLE_TRANSCRIPT_TEXT,
        });
      } catch (err) {
        console.error('Failed to auto-load sample data:', err);
      }
    }
  }, []);

  // Main Analysis Handler
  const handleAnalyze = async (
    rawMatrixText: string,
    rawTranscriptText: string,
    matrixFile?: File,
    transcriptFile?: File
  ) => {
    setLoading(true);
    setError(null);

    try {
      let finalMatrixText = rawMatrixText;
      let finalTranscriptText = rawTranscriptText;

      // Extract PDF texts if files are supplied
      if (matrixFile) {
        finalMatrixText = await extractTextFromPdfFile(matrixFile);
      }
      if (transcriptFile) {
        finalTranscriptText = await extractTextFromPdfFile(transcriptFile);
      }

      if (!finalMatrixText.trim() && !finalTranscriptText.trim()) {
        throw new Error('Por favor, envie o Histórico Escolar ou a Matriz Curricular (PDF ou Texto).');
      }

      // If matrix text is missing, fallback to default Engenharia Elétrica
      if (!finalMatrixText.trim()) {
        finalMatrixText = SAMPLE_MATRIX_TEXT;
      }

      // If transcript text is missing, fallback to sample transcript
      if (!finalTranscriptText.trim()) {
        finalTranscriptText = SAMPLE_TRANSCRIPT_TEXT;
      }

      const matrixData = parseMatrixText(finalMatrixText);
      const transcriptData = parseTranscriptText(finalTranscriptText);

      if (matrixData.subjects.length === 0) {
        throw new Error('Não foi possível identificar disciplinas na Matriz Curricular. Verifique se o arquivo enviado é uma Matriz válida do IdUFF.');
      }

      const summary = analyzeStudentProgress(matrixData, transcriptData);

      setAnalysisResult({
        summary,
        matrix: matrixData,
      });

      // Reset filters
      setSelectedEmphasis('ALL');
      setStatusFilter('ALL');

      // Save state to localStorage
      saveAppStateToStorage({
        analysisResult: summary,
        matrixData,
        rawMatrixText: finalMatrixText,
        rawTranscriptText: finalTranscriptText,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    clearAppStateFromStorage();
    setAnalysisResult(null);
    setSelectedSubject(null);
    setError(null);
  };

  // Map of all subjects for fast lookup in modal and navigation
  const allSubjectsMap = useMemo(() => {
    const map = new Map<string, SubjectAnalysisItem>();
    if (!analysisResult) return map;
    for (const group of analysisResult.summary.periodGroups) {
      for (const subj of group.subjects) {
        map.set(subj.code.toUpperCase(), subj);
      }
    }
    return map;
  }, [analysisResult]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  UFF Matrizes & Histórico
                </h1>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  IdUFF
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Fluxograma Interativo em Canvas & Acompanhamento de Ênfases
              </p>
            </div>
          </div>

          {/* Search Bar & View Mode Toggle */}
          {analysisResult && (
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative hidden sm:block w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar código ou matéria..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveView('flowchart')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeView === 'flowchart'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Fluxograma em Canvas</span>
                  <span className="md:hidden">Canvas</span>
                </button>
                <button
                  onClick={() => setActiveView('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeView === 'table'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Visão por Período</span>
                  <span className="md:hidden">Tabela</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block font-semibold">Erro ao analisar:</strong>
              {error}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <UploadSection
          onAnalyze={handleAnalyze}
          loading={loading}
          hasExistingData={!!analysisResult}
          onClearData={handleClearData}
        />

        {/* Results & Interactive Canvas Section */}
        {analysisResult && (
          <>
            {/* Academic Summary Dashboard */}
            <ProgressDashboard
              summary={analysisResult.summary}
              onSelectSubject={subj => setSelectedSubject(subj)}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              selectedEmphasis={selectedEmphasis}
              onSelectEmphasis={setSelectedEmphasis}
            />

            {/* Main Interactive Flowchart Canvas or Table View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    {activeView === 'flowchart' ? (
                      <>
                        <Layers className="w-5 h-5 text-indigo-400" />
                        Fluxograma Curricular Interativo (Canvas)
                      </>
                    ) : (
                      <>
                        <TableIcon className="w-5 h-5 text-indigo-400" />
                        Grade de Disciplinas por Período
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeView === 'flowchart'
                      ? 'Navegue pelo mapa de dependências, visualize o fluxo de desbloqueio, ênfases e clique em qualquer nó para inspecionar pré-requisitos.'
                      : 'Lista detalhada de matérias organizadas por semestre letivo.'}
                  </p>
                </div>
              </div>

              {/* View Switcher Display */}
              {activeView === 'flowchart' ? (
                <FlowchartCanvas
                  summary={analysisResult.summary}
                  onSelectSubject={subj => setSelectedSubject(subj)}
                  selectedSubject={selectedSubject}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  selectedEmphasis={selectedEmphasis}
                  onSelectEmphasis={setSelectedEmphasis}
                />
              ) : (
                <TableView
                  summary={analysisResult.summary}
                  onSelectSubject={subj => setSelectedSubject(subj)}
                  selectedSubject={selectedSubject}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                />
              )}
            </div>
          </>
        )}
      </main>


      {/* Subject Detail Inspection Modal */}
      <SubjectDetailModal
        subject={selectedSubject}
        onClose={() => setSelectedSubject(null)}
        allSubjectsMap={allSubjectsMap}
        onSelectRelated={subj => setSelectedSubject(subj)}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>UFF Matrizes & Histórico Escolar • Compatível com IdUFF / PROGRAD UFF</p>
      </footer>
    </div>
  );
}
