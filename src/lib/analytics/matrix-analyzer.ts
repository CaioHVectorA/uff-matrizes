import { MatrixRawData, SubjectRawData } from '../scraper/uff-scraper';
import { ParsedTranscript, TranscriptRecord } from '../parser/transcript-parser';

export type DisplaySubjectStatus = 'COMPLETED' | 'IN_PROGRESS' | 'UNLOCKED' | 'BLOCKED' | 'PENDING';

export interface FlowchartEdge {
  from: string; // Prerequisite subject code
  to: string; // Dependent subject code
  type: 'PREREQUISITE' | 'COREQUISITE';
}

export interface SubjectAnalysisItem {
  code: string;
  name: string;
  period: number;
  workload: number;
  type: 'OBRIGATORIA' | 'OPTATIVA' | 'ELETIVA' | 'COMPLEMENTAR' | 'ESCOLHA' | 'OPTATIVA_ENFASE';
  prerequisites: string[];
  corequisites: string[];
  chPreReq?: number;
  specialPrereq?: string;
  status: DisplaySubjectStatus;
  grade?: number;
  gradeRaw?: string;
  periodSemester?: string;
  missingPrerequisites: string[];
  missingCorequisites: string[];
  isChPreReqMissing: boolean;
  unlocksNext: string[]; // Codes of subjects that depend on this one
  emphasis?: string; // e.g. "Sistemas de Potência"
}

export interface MatrixPeriodGroup {
  period: number; // 0 for Electives/Optativas/AC, 1..N for semesters
  title: string;
  subjects: SubjectAnalysisItem[];
  completedHours: number;
  totalHours: number;
}

export interface StudentProgressSummary {
  studentName?: string;
  registration?: string;
  cpf?: string;
  courseName?: string;
  curriculumCode?: string;
  admissionPeriod?: string;
  degree?: string;
  qualification?: string;
  emphasis?: string;
  trainingLine?: string;
  availableEmphases?: string[];
  cr?: number;

  // Hours tracking
  totalMatrixHours: number;
  totalCompletedHours: number;
  mandatoryCompletedHours: number;
  mandatoryTotalHours: number;
  choiceCompletedHours: number;
  choiceTotalHours: number;
  electiveCompletedHours: number;
  electiveTotalHours: number;
  emphasisCompletedHours: number;
  emphasisTotalHours: number;
  complementaryCompletedHours: number;
  complementaryTotalHours: number;
  inProgressHours: number;

  // Percentages
  overallCompletionPercentage: number;
  mandatoryCompletionPercentage: number;
  choiceCompletionPercentage: number;
  electiveCompletionPercentage: number;
  emphasisCompletionPercentage: number;
  complementaryCompletionPercentage: number;

  // Subject counts
  completedSubjectsCount: number;
  inProgressSubjectsCount: number;
  unlockedSubjectsCount: number;
  blockedSubjectsCount: number;
  pendingSubjectsCount: number;

  // Position & Stage calculation
  estimatedCurrentPeriod: number; // e.g. 3º Período
  nextRecommendedSubjects: SubjectAnalysisItem[];

  // Graph and Groups
  edges: FlowchartEdge[];
  periodGroups: MatrixPeriodGroup[];
}


/**
 * Aligns student transcript records with a curriculum matrix and computes progress analytics and dependency graph.
 */
export function analyzeStudentProgress(
  matrix: MatrixRawData,
  transcript: ParsedTranscript
): StudentProgressSummary {
  const completedCodes = new Set<string>();
  const inProgressCodes = new Set<string>();
  const recordMap = new Map<string, TranscriptRecord>();

  // Map student records
  for (const record of transcript.records) {
    const upperCode = record.code.toUpperCase();
    recordMap.set(upperCode, record);

    if (record.status === 'APROVADO' || record.status === 'DISPENSA') {
      completedCodes.add(upperCode);
    } else if (record.status === 'EM_ANDAMENTO') {
      inProgressCodes.add(upperCode);
    }
  }

  // Calculate current completed hours first for CHPre-Req check
  let currentCompletedHours = 0;
  for (const record of transcript.records) {
    if (record.status === 'APROVADO' || record.status === 'DISPENSA') {
      currentCompletedHours += record.workload || 60;
    }
  }
  if (transcript.completedHours && transcript.completedHours > currentCompletedHours) {
    currentCompletedHours = transcript.completedHours;
  }

  // Build reverse map of downstream dependencies (unlocksNext)
  const unlocksNextMap = new Map<string, string[]>();
  const edges: FlowchartEdge[] = [];

  for (const subject of matrix.subjects) {
    const toCode = subject.code.toUpperCase();
    const prereqs = subject.prerequisites || [];
    const coreqs = subject.corequisites || [];

    for (const pCode of prereqs) {
      const pUpper = pCode.toUpperCase();
      if (!unlocksNextMap.has(pUpper)) unlocksNextMap.set(pUpper, []);
      unlocksNextMap.get(pUpper)!.push(toCode);
      edges.push({ from: pUpper, to: toCode, type: 'PREREQUISITE' });
    }

    for (const cCode of coreqs) {
      const cUpper = cCode.toUpperCase();
      if (!unlocksNextMap.has(cUpper)) unlocksNextMap.set(cUpper, []);
      unlocksNextMap.get(cUpper)!.push(toCode);
      edges.push({ from: cUpper, to: toCode, type: 'COREQUISITE' });
    }
  }

  // Check 9th period complete status
  const periods1to9MandatoryCodes = matrix.subjects
    .filter(s => s.period >= 1 && s.period <= 9 && s.type === 'OBRIGATORIA')
    .map(s => s.code.toUpperCase());
  const isPeriod9Complete = periods1to9MandatoryCodes.every(c => completedCodes.has(c));

  const analyzedSubjects: SubjectAnalysisItem[] = [];

  // Analyze each matrix subject
  for (const subject of matrix.subjects) {
    const code = subject.code.toUpperCase();
    const record = recordMap.get(code);
    const prereqs = subject.prerequisites || [];
    const coreqs = subject.corequisites || [];

    // Find missing prerequisites
    const missingPrerequisites = prereqs.filter(pCode => !completedCodes.has(pCode.toUpperCase()));
    const missingCorequisites = coreqs.filter(
      cCode => !completedCodes.has(cCode.toUpperCase()) && !inProgressCodes.has(cCode.toUpperCase())
    );

    // Check CHPre-Req condition
    let isChPreReqMissing = false;
    if (subject.chPreReq && currentCompletedHours < subject.chPreReq) {
      isChPreReqMissing = true;
    }

    // Check special prereq (e.g. 9º período completo)
    let isSpecialMissing = false;
    if (subject.specialPrereq && subject.specialPrereq.includes('9º período') && !isPeriod9Complete) {
      isSpecialMissing = true;
    }

    let status: DisplaySubjectStatus = 'PENDING';

    if (completedCodes.has(code)) {
      status = 'COMPLETED';
    } else if (inProgressCodes.has(code)) {
      status = 'IN_PROGRESS';
    } else if (
      missingPrerequisites.length === 0 &&
      !isChPreReqMissing &&
      !isSpecialMissing
    ) {
      status = 'UNLOCKED';
    } else {
      status = 'BLOCKED';
    }

    analyzedSubjects.push({
      code: subject.code,
      name: subject.name,
      period: subject.period,
      workload: subject.workload,
      type: subject.type,
      prerequisites: subject.prerequisites,
      corequisites: subject.corequisites || [],
      chPreReq: subject.chPreReq,
      specialPrereq: subject.specialPrereq,
      status,
      grade: record?.grade,
      gradeRaw: record?.gradeRaw,
      periodSemester: record?.periodSemester,
      missingPrerequisites,
      missingCorequisites,
      isChPreReqMissing,
      unlocksNext: unlocksNextMap.get(code) || [],
      emphasis: subject.emphasis,
    });
  }

  // Account for extra completed subjects from transcript that might not be in the matrix
  const matrixCodes = new Set(matrix.subjects.map(s => s.code.toUpperCase()));
  for (const record of transcript.records) {
    const upperCode = record.code.toUpperCase();
    if (!matrixCodes.has(upperCode) && (record.status === 'APROVADO' || record.status === 'DISPENSA')) {
      analyzedSubjects.push({
        code: record.code,
        name: record.name,
        period: 0, // Elective/Optativa group
        workload: record.workload || 60,
        type: record.code.startsWith('TGE') && record.name.includes('COMPLEMENTAR') ? 'COMPLEMENTAR' : 'OPTATIVA',
        prerequisites: [],
        corequisites: [],
        status: 'COMPLETED',
        grade: record.grade,
        gradeRaw: record.gradeRaw,
        periodSemester: record.periodSemester,
        missingPrerequisites: [],
        missingCorequisites: [],
        isChPreReqMissing: false,
        unlocksNext: [],
      });
    }
  }

  // Group by period
  const periodMap = new Map<number, SubjectAnalysisItem[]>();
  for (const item of analyzedSubjects) {
    const p = item.period;
    if (!periodMap.has(p)) periodMap.set(p, []);
    periodMap.get(p)!.push(item);
  }

  const periodGroups: MatrixPeriodGroup[] = [];
  const sortedPeriods = Array.from(periodMap.keys()).sort((a, b) => {
    if (a === 0) return 1; // Optativas at the end
    if (b === 0) return -1;
    return a - b;
  });

  for (const period of sortedPeriods) {
    const subjects = periodMap.get(period)!;
    const completedHours = subjects
      .filter(s => s.status === 'COMPLETED')
      .reduce((acc, s) => acc + s.workload, 0);
    const totalHours = subjects.reduce((acc, s) => acc + s.workload, 0);

    let title = `${period}º Período`;
    if (period === 0) title = 'Optativas / Eletivas / AC';

    periodGroups.push({
      period,
      title,
      subjects,
      completedHours,
      totalHours,
    });
  }

  // Calculate detailed stats
  let completedHours = 0;
  let mandatoryCompletedHours = 0;
  let choiceCompletedHours = 0;
  let electiveCompletedHours = 0;
  let emphasisCompletedHours = 0;
  let complementaryCompletedHours = 0;
  let inProgressHours = 0;

  let completedSubjectsCount = 0;
  let inProgressSubjectsCount = 0;
  let unlockedSubjectsCount = 0;
  let blockedSubjectsCount = 0;
  let pendingSubjectsCount = 0;

  for (const item of analyzedSubjects) {
    if (item.status === 'COMPLETED') {
      completedHours += item.workload;
      completedSubjectsCount++;
      if (item.type === 'OBRIGATORIA') {
        mandatoryCompletedHours += item.workload;
      } else if (item.type === 'ESCOLHA') {
        choiceCompletedHours += item.workload;
      } else if (item.type === 'OPTATIVA_ENFASE') {
        emphasisCompletedHours += item.workload;
      } else if (item.type === 'COMPLEMENTAR') {
        complementaryCompletedHours += item.workload;
      } else {
        electiveCompletedHours += item.workload;
      }
    } else if (item.status === 'IN_PROGRESS') {
      inProgressHours += item.workload;
      inProgressSubjectsCount++;
    } else if (item.status === 'UNLOCKED') {
      unlockedSubjectsCount++;
    } else if (item.status === 'BLOCKED') {
      blockedSubjectsCount++;
    } else {
      pendingSubjectsCount++;
    }
  }

  const mandatoryTotalHours = matrix.hoursBreakdown?.mandatory || matrix.mandatoryHours || 3069;
  const choiceTotalHours = matrix.hoursBreakdown?.choice || 510;
  const electiveTotalHours = matrix.hoursBreakdown?.elective || matrix.electiveHours || 120;
  const emphasisTotalHours = matrix.hoursBreakdown?.emphasis || 0;
  const complementaryTotalHours = matrix.hoursBreakdown?.complementary || 280;
  const totalMatrixHours = matrix.totalHours || (mandatoryTotalHours + choiceTotalHours + electiveTotalHours + complementaryTotalHours);

  const overallCompletionPercentage = Math.min(100, Math.round((completedHours / totalMatrixHours) * 100));
  const mandatoryCompletionPercentage = Math.min(100, Math.round((mandatoryCompletedHours / mandatoryTotalHours) * 100));
  const choiceCompletionPercentage = Math.min(100, Math.round((choiceCompletedHours / Math.max(1, choiceTotalHours)) * 100));
  const electiveCompletionPercentage = Math.min(100, Math.round((electiveCompletedHours / Math.max(1, electiveTotalHours)) * 100));
  const emphasisCompletionPercentage = emphasisTotalHours > 0 ? Math.min(100, Math.round((emphasisCompletedHours / emphasisTotalHours) * 100)) : 0;
  const complementaryCompletionPercentage = Math.min(100, Math.round((complementaryCompletedHours / Math.max(1, complementaryTotalHours)) * 100));

  // Determine estimated current period/stage (lowest period with incomplete mandatory subjects)
  let estimatedCurrentPeriod = 1;
  for (const group of periodGroups) {
    if (group.period > 0) {
      const incompleteMandatory = group.subjects.filter(
        s => s.type === 'OBRIGATORIA' && s.status !== 'COMPLETED'
      );
      if (incompleteMandatory.length > 0) {
        estimatedCurrentPeriod = group.period;
        break;
      }
    }
  }

  // Recommended next subjects (UNLOCKED mandatory/choice subjects sorted by lowest period, then number of downstream dependencies)
  const nextRecommendedSubjects = analyzedSubjects
    .filter(s => s.status === 'UNLOCKED' && (s.type === 'OBRIGATORIA' || s.type === 'ESCOLHA'))
    .sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;
      return (b.unlocksNext.length || 0) - (a.unlocksNext.length || 0);
    });

  return {
    studentName: transcript.studentName,
    registration: transcript.registration,
    cpf: transcript.cpf,
    courseName: transcript.courseName || matrix.courseName,
    curriculumCode: transcript.curriculumCode || matrix.courseCode,
    admissionPeriod: transcript.admissionPeriod,
    degree: matrix.degree,
    qualification: transcript.qualification || matrix.qualification,
    emphasis: transcript.emphasis || matrix.emphasis,
    trainingLine: transcript.trainingLine || matrix.trainingLine,
    availableEmphases: matrix.availableEmphases,
    cr: transcript.cr,

    totalMatrixHours,
    totalCompletedHours: completedHours,
    mandatoryCompletedHours,
    mandatoryTotalHours,
    choiceCompletedHours,
    choiceTotalHours,
    electiveCompletedHours,
    electiveTotalHours,
    emphasisCompletedHours,
    emphasisTotalHours,
    complementaryCompletedHours,
    complementaryTotalHours,
    inProgressHours,

    overallCompletionPercentage,
    mandatoryCompletionPercentage,
    choiceCompletionPercentage,
    electiveCompletionPercentage,
    emphasisCompletionPercentage,
    complementaryCompletionPercentage,

    completedSubjectsCount,
    inProgressSubjectsCount,
    unlockedSubjectsCount,
    blockedSubjectsCount,
    pendingSubjectsCount,

    estimatedCurrentPeriod,
    nextRecommendedSubjects,
    edges,
    periodGroups,
  };
}


