'use client';

import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT } from '@/lib/data/sample-data';
import { BUILTIN_UFF_MATRICES } from '@/lib/scraper/builtin-matrices';

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
  const [selectedCoursePreset, setSelectedCoursePreset] = useState<string>('engenharia-eletrica');
  const [useCoursePreset, setUseCoursePreset] = useState<boolean>(true);
  const [rawMatrixText, setRawMatrixText] = useState<string>('');
  const [rawTranscriptText, setRawTranscriptText] = useState<string>('');
  const [showManualText, setShowManualText] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let matrixTxt = rawMatrixText;
    let finalMatrixFile: File | undefined = matrixFile || undefined;

    // If using built-in course preset and no custom matrix PDF is supplied
    if (useCoursePreset && !matrixFile && !rawMatrixText) {
      const presetMatrix = BUILTIN_UFF_MATRICES[selectedCoursePreset];
      if (presetMatrix) {
        if (selectedCoursePreset === 'engenharia-eletrica') {
          matrixTxt = SAMPLE_MATRIX_TEXT;
        } else {
          matrixTxt = JSON.stringify(presetMatrix);
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
    setUseCoursePreset(true);
    setSelectedCoursePreset('engenharia-eletrica');
    await onAnalyze(SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT);
  };

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
            Faça upload dos PDFs do IdUFF do seu caso (Histórico Escolar e Matriz) para carregar o seu Fluxograma no Canvas com ênfases e pré-requisitos.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    if (file) setTranscriptFile(file);
                  }}
                  className="hidden"
                />
                <FileText className="w-9 h-9 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-200 text-center">
                  {transcriptFile ? transcriptFile.name : 'Clique para selecionar seu Histórico Escolar'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 text-center">
                  {transcriptFile
                    ? `${(transcriptFile.size / 1024).toFixed(1)} KB`
                    : 'PDF baixado diretamente do IdUFF / Portal do Aluno'}
                </span>
              </label>
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

          {/* Matriz Curricular Upload Box / Course Preset */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  2. Matriz Curricular (PDF ou Curso UFF)
                </span>
                {matrixFile && (
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    PDF Customizado
                  </span>
                )}
              </div>

              {/* Upload PDF Matriz */}
              <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group mb-3">
                <input
                  type="file"
                  accept=".pdf,text/plain"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMatrixFile(file);
                      setUseCoursePreset(false);
                    }
                  }}
                  className="hidden"
                />
                <BookOpen className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mb-1.5 transition-colors" />
                <span className="text-xs font-bold text-slate-200 text-center">
                  {matrixFile ? matrixFile.name : 'Subir PDF da Matriz Curricular'}
                </span>
                <span className="text-[11px] text-slate-500 text-center">
                  {matrixFile
                    ? `${(matrixFile.size / 1024).toFixed(1)} KB`
                    : 'PDF completo de Matriz do IdUFF'}
                </span>
              </label>

              {/* Or Select Builtin Course Preset */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Ou selecione uma matriz padrão UFF:
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCoursePreset && !matrixFile}
                      onChange={e => setUseCoursePreset(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    Usar Matriz Padrão
                  </label>
                </div>

                <select
                  value={selectedCoursePreset}
                  onChange={e => {
                    setSelectedCoursePreset(e.target.value);
                    setUseCoursePreset(true);
                  }}
                  disabled={!!matrixFile}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
            disabled={loading || (!transcriptFile && !rawTranscriptText && !hasExistingData)}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processando seu Histórico & Gerando Canvas...
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

