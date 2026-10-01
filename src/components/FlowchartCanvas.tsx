'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Clock,
  Unlock,
  Lock,
  AlertCircle,
  Info,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import {
  SubjectAnalysisItem,
  StudentProgressSummary,
  DisplaySubjectStatus
} from '@/lib/analytics/matrix-analyzer';

interface FlowchartCanvasProps {
  summary: StudentProgressSummary;
  onSelectSubject: (subject: SubjectAnalysisItem) => void;
  selectedSubject: SubjectAnalysisItem | null;
  searchQuery: string;
  statusFilter: string;
  selectedEmphasis?: string;
  onSelectEmphasis?: (emphasis: string) => void;
}

const STATUS_THEMES: Record<
  DisplaySubjectStatus,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    accent: string;
    lineColor: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  COMPLETED: {
    bg: 'bg-emerald-950/80 hover:bg-emerald-900/90',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    text: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accent: '#10b981',
    lineColor: '#10b981',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    label: 'Concluída',
  },
  IN_PROGRESS: {
    bg: 'bg-sky-950/80 hover:bg-sky-900/90',
    border: 'border-sky-500/60 hover:border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]',
    text: 'text-sky-200',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    accent: '#0ea5e9',
    lineColor: '#0ea5e9',
    icon: <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />,
    label: 'Em Andamento',
  },
  UNLOCKED: {
    bg: 'bg-amber-950/80 hover:bg-amber-900/90',
    border: 'border-amber-500/60 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    text: 'text-amber-200',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    accent: '#f59e0b',
    lineColor: '#f59e0b',
    icon: <Unlock className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    label: 'Liberada para Cursar',
  },
  BLOCKED: {
    bg: 'bg-rose-950/40 hover:bg-rose-900/60 opacity-80 hover:opacity-100',
    border: 'border-rose-900/50 hover:border-rose-500/50',
    text: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    accent: '#f43f5e',
    lineColor: '#64748b',
    icon: <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
    label: 'Bloqueada',
  },
  PENDING: {
    bg: 'bg-slate-900/80 hover:bg-slate-800/90',
    border: 'border-slate-700/60 hover:border-slate-500',
    text: 'text-slate-300',
    badge: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    accent: '#64748b',
    lineColor: '#475569',
    icon: <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
    label: 'Pendente',
  },
};

export default function FlowchartCanvas({
  summary,
  onSelectSubject,
  selectedSubject,
  searchQuery,
  statusFilter,
  selectedEmphasis = 'ALL',
  onSelectEmphasis,
}: FlowchartCanvasProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Transform state: pan & zoom
  const [transform, setTransform] = useState({ x: 40, y: 30, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hovered subject for connector line illumination
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Node position cache (in canvas coordinates)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(
    new Map()
  );

  // Active focus code: selected subject or hovered subject
  const activeCode = selectedSubject?.code || hoveredCode;

  // Compute upstream (prerequisites) and downstream (unlocksNext) code sets for illumination
  const highlightedChain = useMemo(() => {
    if (!activeCode) return { upstream: new Set<string>(), downstream: new Set<string>() };

    const upperActive = activeCode.toUpperCase();
    const upstream = new Set<string>();
    const downstream = new Set<string>();

    // Upstream (ancestors)
    const queueUp = [upperActive];
    const visitedUp = new Set<string>();
    while (queueUp.length > 0) {
      const current = queueUp.shift()!;
      if (visitedUp.has(current)) continue;
      visitedUp.add(current);

      for (const edge of summary.edges) {
        if (edge.to.toUpperCase() === current) {
          upstream.add(edge.from.toUpperCase());
          queueUp.push(edge.from.toUpperCase());
        }
      }
    }

    // Downstream (descendants)
    const queueDown = [upperActive];
    const visitedDown = new Set<string>();
    while (queueDown.length > 0) {
      const current = queueDown.shift()!;
      if (visitedDown.has(current)) continue;
      visitedDown.add(current);

      for (const edge of summary.edges) {
        if (edge.from.toUpperCase() === current) {
          downstream.add(edge.to.toUpperCase());
          queueDown.push(edge.to.toUpperCase());
        }
      }
    }

    return { upstream, downstream };
  }, [activeCode, summary.edges]);

  // Update node positions from DOM
  const updateNodePositions = useCallback(() => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newPositions = new Map<string, { x: number; y: number; width: number; height: number }>();

    const elements = canvasRef.current.querySelectorAll('[data-subject-code]');
    elements.forEach(el => {
      const code = el.getAttribute('data-subject-code');
      if (code) {
        const rect = el.getBoundingClientRect();
        // Calculate position relative to unscaled canvas origin
        const x = (rect.left - canvasRect.left) / transform.scale;
        const y = (rect.top - canvasRect.top) / transform.scale;
        const width = rect.width / transform.scale;
        const height = rect.height / transform.scale;
        newPositions.set(code.toUpperCase(), { x, y, width, height });
      }
    });

    setNodePositions(newPositions);
  }, [transform.scale]);

  // Recompute positions after render and on resize/period change
  useEffect(() => {
    updateNodePositions();
    const handleResize = () => updateNodePositions();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(updateNodePositions, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [summary, updateNodePositions]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(0.35, transform.scale * zoomFactor), 2.0);

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({
      x: newX,
      y: newY,
      scale: newScale,
    });
  };

  // Zoom control buttons
  const zoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(2.0, prev.scale * 1.2),
    }));
  };

  const zoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.35, prev.scale * 0.8),
    }));
  };

  const resetView = () => {
    setTransform({ x: 40, y: 30, scale: 0.85 });
  };

  const fitToScreen = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const canvasWidth = canvasRef.current.scrollWidth || 2800;
    const calculatedScale = Math.min(1.0, Math.max(0.4, (containerWidth - 60) / canvasWidth));
    setTransform({ x: 30, y: 30, scale: calculatedScale });
  };

  // Jump to specific semester
  const scrollToPeriod = (periodNumber: number) => {
    const el = document.getElementById(`flowchart-period-${periodNumber}`);
    if (el && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const currentRelativeX = elRect.left - containerRect.left;
      setTransform(prev => ({
        ...prev,
        x: prev.x - currentRelativeX + 60,
      }));
    }
  };

  // Generate Bezier path connectors between nodes
  const connectorPaths = useMemo(() => {
    const paths: {
      id: string;
      d: string;
      fromCode: string;
      toCode: string;
      type: 'PREREQUISITE' | 'COREQUISITE';
      isHighlighted: boolean;
      isUpstream: boolean;
      isDownstream: boolean;
      color: string;
      dashArray?: string;
    }[] = [];

    for (const edge of summary.edges) {
      const fromPos = nodePositions.get(edge.from.toUpperCase());
      const toPos = nodePositions.get(edge.to.toUpperCase());

      if (fromPos && toPos) {
        const startX = fromPos.x + fromPos.width;
        const startY = fromPos.y + fromPos.height / 2;

        const endX = toPos.x;
        const endY = toPos.y + toPos.height / 2;

        const deltaX = Math.max(30, (endX - startX) * 0.5);
        const cp1x = startX + deltaX;
        const cp1y = startY;
        const cp2x = endX - deltaX;
        const cp2y = endY;

        const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

        const isUpstream = activeCode ? highlightedChain.upstream.has(edge.from.toUpperCase()) && edge.to.toUpperCase() === activeCode.toUpperCase() : false;
        const isDownstream = activeCode ? edge.from.toUpperCase() === activeCode.toUpperCase() && highlightedChain.downstream.has(edge.to.toUpperCase()) : false;
        const isHighlighted = isUpstream || isDownstream;

        let color = '#334155';
        if (isUpstream) {
          color = '#10b981';
        } else if (isDownstream) {
          color = '#38bdf8';
        }

        paths.push({
          id: `${edge.from}->${edge.to}`,
          d,
          fromCode: edge.from,
          toCode: edge.to,
          type: edge.type,
          isHighlighted,
          isUpstream,
          isDownstream,
          color,
          dashArray: edge.type === 'COREQUISITE' ? '4,4' : undefined,
        });
      }
    }

    return paths;
  }, [summary.edges, nodePositions, activeCode, highlightedChain]);

  return (
    <div className="relative w-full h-[760px] bg-slate-950/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Semester & Emphasis Jump Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 pointer-events-auto shadow-lg overflow-x-auto max-w-full">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Períodos:
          </span>
          {summary.periodGroups.map(group => (
            <button
              key={group.period}
              onClick={() => scrollToPeriod(group.period)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                group.period === summary.estimatedCurrentPeriod
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {group.period === 0 ? 'Optativas' : `${group.period}º`}
            </button>
          ))}

          {/* Ênfase Filter Dropdown if course has emphases */}
          {summary.availableEmphases && summary.availableEmphases.length > 0 && onSelectEmphasis && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <span className="text-[11px] font-semibold text-indigo-300">Ênfase:</span>
              <select
                value={selectedEmphasis}
                onChange={e => onSelectEmphasis(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Todas as Ênfases</option>
                {summary.availableEmphases.map(enf => (
                  <option key={enf} value={enf}>
                    {enf}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Canvas Zoom & View Controls */}
        <div className="flex items-center gap-1 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
          <button
            onClick={zoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-1 min-w-[40px] text-center">
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            onClick={zoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Diminuir Zoom (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={fitToScreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Ajustar à Tela"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Redefinir Posição"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden cursor-${
          isDragging ? 'grabbing' : 'grab'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(51, 65, 85, 0.25) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      >
        <div
          ref={canvasRef}
          className="absolute origin-top-left transition-transform duration-75 ease-out flex gap-8 p-10 min-w-max"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* SVG Overlay for Connection Arrows */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id="arrowhead-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
              <marker
                id="arrowhead-upstream"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="arrowhead-downstream"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Render Connection Paths */}
            {connectorPaths.map(path => (
              <path
                key={path.id}
                d={path.d}
                fill="none"
                stroke={path.color}
                strokeWidth={path.isHighlighted ? 3.0 : 1.2}
                strokeDasharray={path.dashArray}
                opacity={activeCode ? (path.isHighlighted ? 1.0 : 0.15) : 0.35}
                markerEnd={
                  path.isUpstream
                    ? 'url(#arrowhead-upstream)'
                    : path.isDownstream
                    ? 'url(#arrowhead-downstream)'
                    : 'url(#arrowhead-default)'
                }
                className="transition-all duration-200"
              />
            ))}
          </svg>

          {/* Period Columns */}
          {summary.periodGroups.map(group => {
            const isCurrentEstPeriod = group.period === summary.estimatedCurrentPeriod;
            const completionPct =
              group.totalHours > 0 ? Math.round((group.completedHours / group.totalHours) * 100) : 0;

            return (
              <div
                key={group.period}
                id={`flowchart-period-${group.period}`}
                className="flex flex-col w-[280px] shrink-0 z-10"
              >
                {/* Period Column Header */}
                <div
                  className={`p-3.5 mb-4 rounded-xl border backdrop-blur-md transition-all ${
                    isCurrentEstPeriod
                      ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm tracking-wide">
                        {group.title}
                      </span>
                      {isCurrentEstPeriod && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded uppercase">
                          Atual
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {group.completedHours}/{group.totalHours}h
                    </span>
                  </div>

                  {/* Progress mini bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        completionPct === 100
                          ? 'bg-emerald-500'
                          : isCurrentEstPeriod
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Subject Cards within Period */}
                <div className="flex flex-col gap-3.5">
                  {group.subjects.map(subject => {
                    const theme = STATUS_THEMES[subject.status];
                    const upperCode = subject.code.toUpperCase();
                    const isSelected = selectedSubject?.code.toUpperCase() === upperCode;
                    const isHovered = hoveredCode?.toUpperCase() === upperCode;

                    // Filter and search matching
                    const matchesSearch =
                      !searchQuery ||
                      subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      subject.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus =
                      statusFilter === 'ALL' || subject.status === statusFilter;
                    const matchesEmphasis =
                      selectedEmphasis === 'ALL' ||
                      !subject.emphasis ||
                      subject.emphasis === selectedEmphasis;

                    const isDimmed =
                      (activeCode &&
                        upperCode !== activeCode.toUpperCase() &&
                        !highlightedChain.upstream.has(upperCode) &&
                        !highlightedChain.downstream.has(upperCode)) ||
                      !matchesSearch ||
                      !matchesStatus ||
                      !matchesEmphasis;

                    return (
                      <div
                        key={subject.code}
                        data-subject-code={subject.code}
                        data-no-pan="true"
                        onClick={() => onSelectSubject(subject)}
                        onMouseEnter={() => setHoveredCode(subject.code)}
                        onMouseLeave={() => setHoveredCode(null)}
                        className={`group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                          theme.bg
                        } ${
                          isSelected
                            ? 'ring-2 ring-indigo-400 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]'
                            : theme.border
                        } ${isDimmed ? 'opacity-25 grayscale-[60%]' : 'opacity-100'} ${
                          isHovered && !isSelected ? 'scale-[1.01]' : ''
                        }`}
                      >
                        {/* Header: Code & Type & Workload */}
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-100 tracking-wider">
                              {subject.code}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
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
                              {subject.type === 'OBRIGATORIA'
                                ? 'OB'
                                : subject.type === 'ESCOLHA'
                                ? 'E'
                                : subject.type === 'OPTATIVA_ENFASE'
                                ? 'ON'
                                : subject.type === 'COMPLEMENTAR'
                                ? 'AC'
                                : 'OPT'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {subject.workload}h
                          </span>
                        </div>

                        {/* Subject Name */}
                        <h4 className="font-semibold text-xs text-slate-100 line-clamp-2 mb-1.5 leading-tight">
                          {subject.name}
                        </h4>

                        {/* Emphasis or Equivalence pill if available */}
                        {subject.emphasis && (
                          <div className="mb-2">
                            <span className="text-[9px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                              Trilha: {subject.emphasis}
                            </span>
                          </div>
                        )}

                        {subject.isEquivalent && (
                          <div className="mb-1.5 flex items-center gap-1">
                            <span className="text-[9px] font-bold text-teal-300 bg-teal-950/90 border border-teal-500/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ArrowLeftRight className="w-2.5 h-2.5 text-teal-400" />
                              Eq: {subject.equivalenceInfo?.equivalentCode}
                            </span>
                          </div>
                        )}

                        {/* Status Footer Pill */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-auto">
                          <div className="flex items-center gap-1.5">
                            {theme.icon}
                            <span className={`text-[11px] font-medium ${theme.text}`}>
                              {subject.status === 'COMPLETED'
                                ? subject.gradeRaw
                                  ? `Nota: ${subject.gradeRaw}`
                                  : subject.grade !== undefined
                                  ? `Nota: ${subject.grade.toFixed(1)}`
                                  : 'Concluída'
                                : subject.status === 'IN_PROGRESS'
                                ? 'Cursando'
                                : subject.status === 'UNLOCKED'
                                ? 'Liberada'
                                : subject.status === 'BLOCKED'
                                ? `${subject.missingPrerequisites.length} pré-req faltam`
                                : 'Pendente'}
                            </span>
                          </div>

                          {subject.periodSemester && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {subject.periodSemester}
                            </span>
                          )}
                        </div>

                        {/* Dependency Pill count if unlocked */}
                        {subject.unlocksNext && subject.unlocksNext.length > 0 && (
                          <div className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-mono px-1.5 py-0.2 rounded-full shadow-md">
                            +{subject.unlocksNext.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Legend Bar */}
      <div className="p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Legenda:
          </span>
          {Object.entries(STATUS_THEMES).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              {cfg.icon}
              <span className="text-slate-300">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
              <ArrowLeftRight className="w-2.5 h-2.5" />
              Equivalência
            </span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] flex items-center gap-3">
          <span>
            💡 <strong className="text-slate-200">Clique em qualquer matéria</strong> para ver detalhes e iluminar seus pré-requisitos e desbloqueios.
          </span>
          <span>🖱️ Arraste para mover • Scroll para Zoom</span>
        </div>
      </div>
    </div>
  );
}
