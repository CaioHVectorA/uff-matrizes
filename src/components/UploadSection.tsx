'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  RefreshCw,
  Trash2,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Globe,
  Download,
  Search,
  ExternalLink
} from 'lucide-react';
import { SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT } from '@/lib/data/sample-data';
import { BUILTIN_UFF_MATRICES } from '@/lib/scraper/builtin-matrices';
import { extractTextFromPdfFile } from '@/lib/parser/pdf-reader';
import { parseTranscriptText } from '@/lib/parser/transcript-parser';
import { IdUFFCourseItem, IdUFFCurriculumItem } from '@/lib/scraper/iduff-matrix-service';

interface UploadSectionProps {
  onAnalyze: (matrixText: string, transcriptText: string, matrixFile?: File, transcriptFile?: File) => Promise<void>;
  loading: boolean;
  hasExistingData: boolean;
  onClearData: () => void;
}

export default function UploadSection({
  onAnalyze,
  loading,
  hasExistingData,
  onClearData,
}: UploadSectionProps) {
  const [matrixFile, setMatrixFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [rawMatrixText, setRawMatrixText] = useState<string>('');
  const [rawTranscriptText, setRawTranscriptText] = useState<string>('');
  const [showManualText, setShowManualText] = useState(false);

  // Mode: 'iduff' (scraper direto do iduff), 'upload' (arquivo manual), 'preset' (matriz fixa de teste)
  const [matrixSourceMode, setMatrixSourceMode] = useState<'iduff' | 'upload' | 'preset'>('iduff');

  // IdUFF Scraper states
  const [iduffCourses, setIduffCourses] = useState<IdUFFCourseItem[]>([]);
  const [selectedIdUFFCourse, setSelectedIdUFFCourse] = useState<string>('');
  const [iduffCurricula, setIduffCurricula] = useState<IdUFFCurriculumItem[]>([]);
  const [selectedCurriculumIndex, setSelectedCurriculumIndex] = useState<number>(0);
  const [loadingIdUFF, setLoadingIdUFF] = useState(false);
  const [iduffError, setIduffError] = useState<string | null>(null);
  const [iduffSuccessMsg, setIduffSuccessMsg] = useState<string | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');

  // Auto-detected info from uploaded Histórico Escolar
  const [detectedFromTranscript, setDetectedFromTranscript] = useState<{
    courseName?: string;
    curriculumCode?: string;
  } | null>(null);

  // Course preset fallback
  const [selectedCoursePreset, setSelectedCoursePreset] = useState<string>('engenharia-eletrica');

  // Load IdUFF courses list on mount
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch('/api/iduff/courses');
        const data = await res.json();
        if (data.success && data.courses) {
          setIduffCourses(data.courses);
        }
      } catch (err) {
        console.warn('Não foi possível carregar lista de cursos do IdUFF em segundo plano:', err);
      }
    }
    loadCourses();
  }, []);

  // When user selects a transcript file, pre-extract header to detect course and curriculum code
  const handleTranscriptFileChange = async (file: File) => {
    setTranscriptFile(file);
    setIduffError(null);
    setIduffSuccessMsg(null);

    try {
      const text = await extractTextFromPdfFile(file);
      const parsed = parseTranscriptText(text);
      if (parsed.courseName) {
        setDetectedFromTranscript({
          courseName: parsed.courseName,
          curriculumCode: parsed.curriculumCode,
        });

        // If IdUFF courses are loaded, pre-select the course if found
        if (iduffCourses.length > 0) {
          const cleanName = parsed.courseName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
          const match = iduffCourses.find(c => {
            const cleanLabel = c.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
            return cleanLabel.includes(cleanName) || cleanName.includes(cleanLabel.replace(/^\d+\s*-\s*/, ''));
          });
          if (match) {
            handleSelectIdUFFCourse(match.value, parsed.curriculumCode);
          }
        }
      }
    } catch (err) {
      console.warn('Não foi possível pré-extrair dados do cabeçalho do histórico:', err);
    }
  };

  // When a course is selected in IdUFF dropdown
  const handleSelectIdUFFCourse = async (courseValue: string, preferredCurriculumCode?: string) => {
    setSelectedIdUFFCourse(courseValue);
    setIduffSuccessMsg(null);
    if (!courseValue) {
      setIduffCurricula([]);
      return;
    }

    setLoadingIdUFF(true);
    setIduffError(null);
    try {
      const res = await fetch(`/api/iduff/curricula?course=${encodeURIComponent(courseValue)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao carregar currículos do IdUFF');

      const list: IdUFFCurriculumItem[] = data.curricula || [];
      setIduffCurricula(list);

      if (list.length > 0) {
        let bestIndex = list.length - 1; // Default to latest version
        if (preferredCurriculumCode) {
          const cleanCode = preferredCurriculumCode.trim();
          const found = list.findIndex(c => c.curriculumCode.includes(cleanCode) || cleanCode.includes(c.curriculumCode));
          if (found >= 0) bestIndex = found;
        }
        setSelectedCurriculumIndex(bestIndex);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setIduffError(msg);
    } finally {
      setLoadingIdUFF(false);
    }
  };

  // Download official matrix PDF directly from IdUFF
  const handleDownloadIdUFFMatrix = async (courseVal?: string, rowIdx?: number) => {
    const courseToUse = courseVal || selectedIdUFFCourse;
    const rowToUse = rowIdx !== undefined ? rowIdx : selectedCurriculumIndex;

    if (!courseToUse) {
      setIduffError('Selecione um curso antes de baixar a matriz do IdUFF.');
      return;
    }

    setLoadingIdUFF(true);
    setIduffError(null);
    setIduffSuccessMsg(null);

    try {
      const res = await fetch('/api/iduff/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: courseToUse,
          rowIndex: rowToUse,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Erro ${res.status} ao baixar matriz do IdUFF.`);
      }

      const blob = await res.blob();
      const curr = iduffCurricula[rowToUse];
      const filename = `Matriz-IdUFF-${curr ? curr.curriculumCode : 'Oficial'}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      setMatrixFile(file);
      setIduffSuccessMsg(`Matriz oficial baixada com sucesso do IdUFF (${curr?.curriculumCode || 'Versão Selecionada'})!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setIduffError(msg);
    } finally {
      setLoadingIdUFF(false);
    }
  };

  // Auto-fetch matrix directly using detected course & curriculum from transcript
  const handleAutoFetchFromTranscript = async () => {
    if (!detectedFromTranscript?.courseName) return;

    setLoadingIdUFF(true);
    setIduffError(null);
    setIduffSuccessMsg(null);

    try {
      const res = await fetch('/api/iduff/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoMatchCourseName: detectedFromTranscript.courseName,
          curriculumCode: detectedFromTranscript.curriculumCode,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Erro ${res.status} ao consultar IdUFF.`);
      }

      const courseMatched = decodeURIComponent(res.headers.get('X-Course-Matched') || detectedFromTranscript.courseName);
      const currMatched = decodeURIComponent(res.headers.get('X-Curriculum-Matched') || '');

      const blob = await res.blob();
      const filename = `Matriz-IdUFF-${currMatched || 'Oficial'}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      setMatrixFile(file);
      setIduffSuccessMsg(`Matriz oficial identificada e baixada do IdUFF: ${courseMatched} (${currMatched})!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setIduffError(msg);
    } finally {
      setLoadingIdUFF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let matrixTxt = rawMatrixText;
    let finalMatrixFile: File | undefined = matrixFile || undefined;

    // If user has not uploaded a matrix file and is using IdUFF mode
    if (!finalMatrixFile && !matrixTxt) {
      if (matrixSourceMode === 'iduff' && selectedIdUFFCourse) {
        // Automatically download from IdUFF before analyzing
        setLoadingIdUFF(true);
        try {
          const res = await fetch('/api/iduff/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course: selectedIdUFFCourse,
              rowIndex: selectedCurriculumIndex,
            }),
          });
          if (res.ok) {
            const blob = await res.blob();
            finalMatrixFile = new File([blob], 'Matriz-IdUFF.pdf', { type: 'application/pdf' });
          }
        } catch (err) {
          console.error('Error auto-fetching matrix during submit:', err);
        } finally {
          setLoadingIdUFF(false);
        }
      } else if (matrixSourceMode === 'iduff' && detectedFromTranscript?.courseName) {
        // Auto-fetch using transcript detected course
        setLoadingIdUFF(true);
        try {
          const res = await fetch('/api/iduff/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              autoMatchCourseName: detectedFromTranscript.courseName,
              curriculumCode: detectedFromTranscript.curriculumCode,
            }),
          });
          if (res.ok) {
            const blob = await res.blob();
            finalMatrixFile = new File([blob], 'Matriz-IdUFF-Auto.pdf', { type: 'application/pdf' });
          }
        } catch (err) {
          console.error('Error auto-fetching matrix from transcript:', err);
        } finally {
          setLoadingIdUFF(false);
        }
      } else if (matrixSourceMode === 'preset') {
        const presetMatrix = BUILTIN_UFF_MATRICES[selectedCoursePreset];
        if (presetMatrix) {
          if (selectedCoursePreset === 'engenharia-eletrica') {
            matrixTxt = SAMPLE_MATRIX_TEXT;
          } else {
            matrixTxt = JSON.stringify(presetMatrix);
          }
        }
      }
    }

    await onAnalyze(matrixTxt, rawTranscriptText, finalMatrixFile, transcriptFile || undefined);
  };

  const handleLoadSample = async () => {
    setRawMatrixText(SAMPLE_MATRIX_TEXT);
    setRawTranscriptText(SAMPLE_TRANSCRIPT_TEXT);
    setMatrixFile(null);
    setTranscriptFile(null);
    setMatrixSourceMode('preset');
    setSelectedCoursePreset('engenharia-eletrica');
    await onAnalyze(SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT);
  };

  const filteredCourses = iduffCourses.filter(c =>
    !courseSearchQuery ||
    c.label.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
    c.value.toLowerCase().includes(courseSearchQuery.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 bg-slate-900/90 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            Carregar Histórico & Matriz Curricular
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Envie seu <strong>Histórico Escolar</strong> e obtenha a <strong>Matriz Curricular</strong> automaticamente direto do IdUFF (sem precisar baixá-la manualmente)!
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Testar Exemplo Real (Eng. Elétrica)
          </button>

          {hasExistingData && (
            <button
              type="button"
              onClick={onClearData}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 hover:border-rose-500/30 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histórico Escolar Upload Box */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  1. Seu Histórico Escolar (PDF)
                </span>
                {transcriptFile ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Arquivo Pronto
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Obrigatório
                  </span>
                )}
              </div>

              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group">
                <input
                  type="file"
                  accept=".pdf,text/plain"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleTranscriptFileChange(file);
                  }}
                  className="hidden"
                />
                <FileText className="w-9 h-9 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-200 text-center">
                  {transcriptFile ? transcriptFile.name : 'Clique para selecionar seu Histórico Escolar (PDF)'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 text-center">
                  {transcriptFile
                    ? `${(transcriptFile.size / 1024).toFixed(1)} KB`
                    : 'PDF baixado diretamente do IdUFF / Portal do Aluno'}
                </span>
              </label>

              {/* Intelligent Auto-detection Banner from Histórico */}
              {detectedFromTranscript?.courseName && (
                <div className="mt-4 p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Identificado no seu histórico:</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    <strong>{detectedFromTranscript.courseName}</strong>
                    {detectedFromTranscript.curriculumCode && (
                      <span className="ml-2 font-mono text-emerald-300 bg-emerald-900/40 px-1.5 py-0.5 rounded">
                        Currículo: {detectedFromTranscript.curriculumCode}
                      </span>
                    )}
                  </p>

                  {!matrixFile && (
                    <button
                      type="button"
                      onClick={handleAutoFetchFromTranscript}
                      disabled={loadingIdUFF}
                      className="mt-1 w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loadingIdUFF ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Consultando Matriz no IdUFF...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Puxar Matriz Oficial do IdUFF com 1 Clique
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {showManualText && (
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Ou cole o texto do seu Histórico:
                </span>
                <textarea
                  value={rawTranscriptText}
                  onChange={e => setRawTranscriptText(e.target.value)}
                  placeholder="Cole aqui o texto do histórico escolar..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Matriz Curricular: IdUFF Scraper / Upload / Preset */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              {/* Header & Source Mode Tabs */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  2. Matriz Curricular do Curso
                </span>

                <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMatrixSourceMode('iduff')}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      matrixSourceMode === 'iduff'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    IdUFF Oficial (Novo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixSourceMode('upload')}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      matrixSourceMode === 'upload'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Subir Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixSourceMode('preset')}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      matrixSourceMode === 'preset'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Padrões UFF
                  </button>
                </div>
              </div>

              {/* Status pill if matrix is loaded */}
              {matrixFile && (
                <div className="mb-3 p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Matriz carregada: <strong>{matrixFile.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatrixFile(null)}
                    className="text-slate-400 hover:text-rose-300 text-[11px]"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* Feedback messages */}
              {iduffError && (
                <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{iduffError}</span>
                </div>
              )}

              {iduffSuccessMsg && (
                <div className="mb-3 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{iduffSuccessMsg}</span>
                </div>
              )}

              {/* MODE 1: Direct IdUFF Scraper */}
              {matrixSourceMode === 'iduff' && (
                <div className="space-y-3 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-sky-400" />
                      Consulta Direta no IdUFF ({iduffCourses.length || '100+'} Cursos)
                    </span>
                    <a
                      href="https://app.uff.br/iduff/consultaMatrizCurricular.uff"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                    >
                      app.uff.br <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Course Search / Filter input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={courseSearchQuery}
                      onChange={e => setCourseSearchQuery(e.target.value)}
                      placeholder="Filtrar curso (ex: Elétrica, Direito, Medicina, Computação)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Course Select */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Selecione o Curso:</label>
                    <select
                      value={selectedIdUFFCourse}
                      onChange={e => handleSelectIdUFFCourse(e.target.value)}
                      disabled={loadingIdUFF}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="">-- Escolha um curso da UFF --</option>
                      {filteredCourses.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Curriculum Versions (if course selected) */}
                  {selectedIdUFFCourse && iduffCurricula.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-[11px] text-slate-400 block">
                        Versão do Currículo Disponível:
                      </label>
                      <select
                        value={selectedCurriculumIndex}
                        onChange={e => setSelectedCurriculumIndex(parseInt(e.target.value, 10))}
                        disabled={loadingIdUFF}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {iduffCurricula.map((curr, idx) => (
                          <option key={curr.rowIndex} value={idx}>
                            Currículo {curr.curriculumCode} • {curr.turno} • {curr.degree} {curr.emphasis !== '-' ? `• Ênfase: ${curr.emphasis}` : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDownloadIdUFFMatrix()}
                        disabled={loadingIdUFF}
                        className="w-full mt-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                      >
                        {loadingIdUFF ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Baixando do IdUFF...
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            Baixar Matriz Oficial Selecionada do IdUFF
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {loadingIdUFF && !iduffCurricula.length && (
                    <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      Consultando versões do currículo no IdUFF...
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: Manual PDF Upload */}
              {matrixSourceMode === 'upload' && (
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group">
                  <input
                    type="file"
                    accept=".pdf,text/plain"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setMatrixFile(file);
                    }}
                    className="hidden"
                  />
                  <BookOpen className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mb-1.5 transition-colors" />
                  <span className="text-xs font-bold text-slate-200 text-center">
                    {matrixFile ? matrixFile.name : 'Selecionar Arquivo PDF da Matriz'}
                  </span>
                  <span className="text-[11px] text-slate-500 text-center">
                    {matrixFile
                      ? `${(matrixFile.size / 1024).toFixed(1)} KB`
                      : 'PDF completo de Matriz exportado do IdUFF'}
                  </span>
                </label>
              )}

              {/* MODE 3: Preset Matrices */}
              {matrixSourceMode === 'preset' && (
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Selecione uma matriz padrão embutida:
                  </span>
                  <select
                    value={selectedCoursePreset}
                    onChange={e => setSelectedCoursePreset(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="engenharia-eletrica">Engenharia Elétrica (Currículo 38.01.003 - 10 períodos + Ênfases)</option>
                    <option value="ciencia-da-computacao">Ciência da Computação (Niterói)</option>
                    <option value="sistemas-de-informacao">Sistemas de Informação</option>
                    <option value="engenharia-de-software">Engenharia de Software</option>
                    <option value="ciencia-de-dados">Ciência de Dados</option>
                    <option value="engenharia-de-telecomunicacoes">Engenharia de Telecomunicações</option>
                    <option value="engenharia-de-producao">Engenharia de Produção</option>
                  </select>
                </div>
              )}
            </div>

            {showManualText && (
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Ou cole o texto da sua Matriz:
                </span>
                <textarea
                  value={rawMatrixText}
                  onChange={e => setRawMatrixText(e.target.value)}
                  placeholder="Cole aqui o texto da matriz curricular..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setShowManualText(!showManualText)}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4"
          >
            {showManualText ? 'Ocultar caixas de texto manual' : 'Colar texto manualmente (sem PDF)'}
          </button>

          <button
            type="submit"
            disabled={loading || loadingIdUFF || (!transcriptFile && !rawTranscriptText && !hasExistingData)}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading || loadingIdUFF ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processando & Consultando IdUFF...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Carregar Meu Fluxograma no Canvas
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
