'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Sparkles,
  Layers,
  Table as TableIcon,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowLeftRight
} from 'lucide-react';
import {
  SubjectAnalysisItem,
  StudentProgressSummary,
  analyzeStudentProgress
} from '@/lib/analytics/matrix-analyzer';
import { extractTextFromPdfFile, extractTextFromPdfBuffer } from '@/lib/parser/pdf-reader';
import { parseMatrixText } from '@/lib/parser/matrix-parser';
import { parseTranscriptText, ParsedTranscript } from '@/lib/parser/transcript-parser';
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
import EquivalenceConfirmModal from '@/components/EquivalenceConfirmModal';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Raw and parsed persistent states
  const [currentMatrixData, setCurrentMatrixData] = useState<MatrixRawData | null>(null);
  const [currentTranscriptData, setCurrentTranscriptData] = useState<ParsedTranscript | null>(null);
  const [rawMatrixTextCache, setRawMatrixTextCache] = useState<string>('');
  const [rawTranscriptTextCache, setRawTranscriptTextCache] = useState<string>('');
  const [customEquivalences, setCustomEquivalences] = useState<Record<string, string>>({});
  const [manualStatusMap, setManualStatusMap] = useState<Record<string, 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'>>({});

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
  const [isEquivalenceModalOpen, setIsEquivalenceModalOpen] = useState(false);

  // Restore state from localStorage on initial load (if previously uploaded by user)
  useEffect(() => {
    const saved = loadAppStateFromStorage();
    if (saved && saved.matrixData) {
      const eqMap = saved.customEquivalences || {};
      const manMap = saved.manualStatusMap || {};
      setCustomEquivalences(eqMap);
      setManualStatusMap(manMap);
      setCurrentMatrixData(saved.matrixData);
      setCurrentTranscriptData(saved.transcriptData || null);
      setRawMatrixTextCache(saved.rawMatrixText || '');
      setRawTranscriptTextCache(saved.rawTranscriptText || '');

      const summary = analyzeStudentProgress(
        saved.matrixData,
        saved.transcriptData || null,
        eqMap,
        manMap
      );
      setAnalysisResult({
        summary,
        matrix: saved.matrixData,
      });
    } else if (saved && saved.analysisResult && saved.matrixData) {
      setAnalysisResult({
        summary: saved.analysisResult,
        matrix: saved.matrixData,
      });
      setCurrentMatrixData(saved.matrixData);
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
        throw new Error('Por favor, selecione um curso da UFF ou envie a Matriz Curricular (PDF). O Histórico Escolar é opcional.');
      }

      // If matrix text is missing but transcript is present, attempt to auto-fetch official matrix from IdUFF
      if (!finalMatrixText.trim() && finalTranscriptText.trim()) {
        try {
          const preParsed = parseTranscriptText(finalTranscriptText);
          if (preParsed.courseName) {
            const res = await fetch('/api/iduff/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                autoMatchCourseName: preParsed.courseName,
                curriculumCode: preParsed.curriculumCode,
              }),
            });
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const extracted = await extractTextFromPdfBuffer(arrayBuf);
              if (extracted && extracted.trim()) {
                finalMatrixText = extracted;
              }
            }
          }
        } catch (autoErr) {
          console.warn('Auto-fetch matrix from IdUFF failed, using fallback sample:', autoErr);
        }
      }

      // If matrix text is still missing, fallback to default matrix
      if (!finalMatrixText.trim()) {
        finalMatrixText = SAMPLE_MATRIX_TEXT;
      }

      const matrixData = parseMatrixText(finalMatrixText);
      const transcriptData = finalTranscriptText.trim() ? parseTranscriptText(finalTranscriptText) : null;

      if (matrixData.subjects.length === 0) {
        throw new Error('Não foi possível identificar disciplinas na Matriz Curricular. Verifique se o arquivo enviado é uma Matriz válida do IdUFF.');
      }

      const summary = analyzeStudentProgress(matrixData, transcriptData, customEquivalences, manualStatusMap);

      setCurrentMatrixData(matrixData);
      setCurrentTranscriptData(transcriptData);
      setRawMatrixTextCache(finalMatrixText);
      setRawTranscriptTextCache(finalTranscriptText);

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
        transcriptData: transcriptData || undefined,
        customEquivalences,
        manualStatusMap,
        rawMatrixText: finalMatrixText,
        rawTranscriptText: finalTranscriptText,
      });

      // Automatically popup the Equivalence Confirmation Modal if candidates were detected
      if (summary.detectedEquivalenceCandidates && summary.detectedEquivalenceCandidates.length > 0) {
        setIsEquivalenceModalOpen(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Multi-candidate Equivalence Confirmation
  const handleConfirmCandidateEquivalences = useCallback((selectedMappings: Record<string, string>) => {
    setCustomEquivalences(selectedMappings);

    if (currentMatrixData) {
      const updatedSummary = analyzeStudentProgress(
        currentMatrixData,
        currentTranscriptData,
        selectedMappings,
        manualStatusMap
      );

      setAnalysisResult({
        summary: updatedSummary,
        matrix: currentMatrixData,
      });

      // Persist updated equivalences to localStorage
      saveAppStateToStorage({
        analysisResult: updatedSummary,
        matrixData: currentMatrixData,
        transcriptData: currentTranscriptData || undefined,
        customEquivalences: selectedMappings,
        manualStatusMap,
        rawMatrixText: rawMatrixTextCache,
        rawTranscriptText: rawTranscriptTextCache,
      });
    }
  }, [currentMatrixData, currentTranscriptData, manualStatusMap, rawMatrixTextCache, rawTranscriptTextCache]);

  // Handle Single Subject Equivalence Assignment or Removal
  const handleSetEquivalence = useCallback((matrixCode: string, transcriptCode: string | null) => {
    const upperMatrix = matrixCode.toUpperCase().trim();
    const newEquivalences = { ...customEquivalences };

    if (!transcriptCode) {
      delete newEquivalences[upperMatrix];
    } else {
      newEquivalences[upperMatrix] = transcriptCode.toUpperCase().trim();
    }

    setCustomEquivalences(newEquivalences);

    if (currentMatrixData) {
      const updatedSummary = analyzeStudentProgress(
        currentMatrixData,
        currentTranscriptData,
        newEquivalences,
        manualStatusMap
      );

      setAnalysisResult({
        summary: updatedSummary,
        matrix: currentMatrixData,
      });

      // Update selectedSubject in modal if currently open
      if (selectedSubject) {
        const allUpdated = updatedSummary.periodGroups.flatMap(g => g.subjects);
        const updatedSelected = allUpdated.find(
          s => s.code.toUpperCase().trim() === selectedSubject.code.toUpperCase().trim()
        );
        if (updatedSelected) {
          setSelectedSubject(updatedSelected);
        }
      }

      // Persist updated equivalences to localStorage
      saveAppStateToStorage({
        analysisResult: updatedSummary,
        matrixData: currentMatrixData,
        transcriptData: currentTranscriptData || undefined,
        customEquivalences: newEquivalences,
        manualStatusMap,
        rawMatrixText: rawMatrixTextCache,
        rawTranscriptText: rawTranscriptTextCache,
      });
    }
  }, [customEquivalences, currentMatrixData, currentTranscriptData, manualStatusMap, selectedSubject, rawMatrixTextCache, rawTranscriptTextCache]);

  // Handle Manual Subject Status Toggles (Concluída / Cursando / Pendente)
  const handleUpdateSubjectStatus = useCallback((code: string, newStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING') => {
    const upperCode = code.toUpperCase().trim();
    const updatedMap = { ...manualStatusMap, [upperCode]: newStatus };
    setManualStatusMap(updatedMap);

    if (currentMatrixData) {
      const updatedSummary = analyzeStudentProgress(
        currentMatrixData,
        currentTranscriptData,
        customEquivalences,
        updatedMap
      );

      setAnalysisResult({
        summary: updatedSummary,
        matrix: currentMatrixData,
      });

      // Update modal view immediately if open
      if (selectedSubject && selectedSubject.code.toUpperCase().trim() === upperCode) {
        const matchingAnalyzed = updatedSummary.periodGroups
          .flatMap(g => g.subjects)
          .find(s => s.code.toUpperCase().trim() === upperCode);
        if (matchingAnalyzed) {
          setSelectedSubject(matchingAnalyzed);
        }
      }

      saveAppStateToStorage({
        analysisResult: updatedSummary,
        matrixData: currentMatrixData,
        transcriptData: currentTranscriptData || undefined,
        customEquivalences,
        manualStatusMap: updatedMap,
        rawMatrixText: rawMatrixTextCache,
        rawTranscriptText: rawTranscriptTextCache,
      });
    }
  }, [currentMatrixData, currentTranscriptData, customEquivalences, manualStatusMap, rawMatrixTextCache, rawTranscriptTextCache, selectedSubject]);

  const handleClearData = () => {
    clearAppStateFromStorage();
    setAnalysisResult(null);
    setCurrentMatrixData(null);
    setCurrentTranscriptData(null);
    setRawMatrixTextCache('');
    setRawTranscriptTextCache('');
    setCustomEquivalences({});
    setManualStatusMap({});
    setSelectedSubject(null);
    setIsEquivalenceModalOpen(false);
    setError(null);
  };

  // Map of all subjects for fast lookup in modal and navigation
  const allSubjectsMap = useMemo(() => {
    const map = new Map<string, SubjectAnalysisItem>();
    if (!analysisResult) return map;
    for (const group of analysisResult.summary.periodGroups) {
      for (const subj of group.subjects) {
        map.set(subj.code.toUpperCase().trim(), subj);
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
                Fluxograma Interativo em Canvas, Pré-requisitos & Equivalências
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
              onOpenEquivalenceModal={() => setIsEquivalenceModalOpen(true)}
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
                      ? 'Navegue pelo mapa de dependências, visualize o fluxo de desbloqueio, ênfases e clique em qualquer nó para inspecionar ou vincular equivalências.'
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

      {/* Single Subject Detail Inspection Modal */}
      <SubjectDetailModal
        subject={selectedSubject}
        onClose={() => setSelectedSubject(null)}
        allSubjectsMap={allSubjectsMap}
        onSelectRelated={subj => setSelectedSubject(subj)}
        availableTranscriptRecords={analysisResult?.summary.availableCompletedTranscriptRecords}
        onSetEquivalence={handleSetEquivalence}
        onUpdateSubjectStatus={handleUpdateSubjectStatus}
      />

      {/* Batch Equivalence Confirmation Popup Modal */}
      {analysisResult && (
        <EquivalenceConfirmModal
          isOpen={isEquivalenceModalOpen}
          onClose={() => setIsEquivalenceModalOpen(false)}
          candidates={analysisResult.summary.detectedEquivalenceCandidates || []}
          onConfirm={handleConfirmCandidateEquivalences}
          currentEquivalences={customEquivalences}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>UFF Matrizes & Histórico Escolar • 100% Client-Side • Compatível com IdUFF / PROGRAD UFF</p>
      </footer>
    </div>
  );
}
