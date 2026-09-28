import { MatrixRawData, SubjectRawData } from '../scraper/uff-scraper';
import { ParsedTranscript, TranscriptRecord } from '../parser/transcript-parser';

export type DisplaySubjectStatus = 'COMPLETED' | 'IN_PROGRESS' | 'UNLOCKED' | 'BLOCKED' | 'PENDING';

export interface SubjectAnalysisItem {
  code: string;
  name: string;
  period: number;
  workload: number;
  type: 'OBRIGATORIA' | 'OPTATIVA' | 'ELETIVA';
  prerequisites: string[];
  status: DisplaySubjectStatus;
  grade?: number;
  periodSemester?: string;
  missingPrerequisites: string[];
}

export interface MatrixPeriodGroup {
  period: number; // 0 for Electives/Optativas, 1..N for semesters
  title: string;
  subjects: SubjectAnalysisItem[];
  completedHours: number;
  totalHours: number;
}

export interface StudentProgressSummary {
  studentName?: string;
  registration?: string;
  courseName?: string;
  cr?: number;

  // Hours tracking
  totalMatrixHours: number;
  totalCompletedHours: number;
  mandatoryCompletedHours: number;
  mandatoryTotalHours: number;
  electiveCompletedHours: number;
  electiveTotalHours: number;
  inProgressHours: number;

  // Percentages
  overallCompletionPercentage: number;
  mandatoryCompletionPercentage: number;
  electiveCompletionPercentage: number;

  // Subject counts
  completedSubjectsCount: number;
  inProgressSubjectsCount: number;
  unlockedSubjectsCount: number;
  blockedSubjectsCount: number;
  pendingSubjectsCount: number;

  // Position & Stage calculation
  estimatedCurrentPeriod: number; // e.g. 3º Período
  nextRecommendedSubjects: SubjectAnalysisItem[];

  // Grouped periods for rendering UI
  periodGroups: MatrixPeriodGroup[];
}

/**
 * Aligns student transcript records with a curriculum matrix and computes progress analytics.
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

  const analyzedSubjects: SubjectAnalysisItem[] = [];

  // Analyze each matrix subject
  for (const subject of matrix.subjects) {
    const code = subject.code.toUpperCase();
    const record = recordMap.get(code);
    const prereqs = subject.prerequisites || [];

    // Find missing prerequisites
    const missingPrerequisites = prereqs.filter(pCode => !completedCodes.has(pCode.toUpperCase()));

    let status: DisplaySubjectStatus = 'PENDING';

    if (completedCodes.has(code)) {
      status = 'COMPLETED';
    } else if (inProgressCodes.has(code)) {
      status = 'IN_PROGRESS';
    } else if (missingPrerequisites.length === 0) {
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
      status,
      grade: record?.grade,
      periodSemester: record?.periodSemester,
      missingPrerequisites,
    });
  }

  // Account for extra completed electives from transcript that might not be in mandatory matrix
  const matrixCodes = new Set(matrix.subjects.map(s => s.code.toUpperCase()));
  for (const record of transcript.records) {
    const upperCode = record.code.toUpperCase();
    if (!matrixCodes.has(upperCode) && (record.status === 'APROVADO' || record.status === 'DISPENSA')) {
      analyzedSubjects.push({
        code: record.code,
        name: record.name,
        period: 0, // Elective group
        workload: record.workload || 60,
        type: 'OPTATIVA',
        prerequisites: [],
        status: 'COMPLETED',
        grade: record.grade,
        periodSemester: record.periodSemester,
        missingPrerequisites: [],
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
    if (period === 0) title = 'Optativas / Eletivas';

    periodGroups.push({
      period,
      title,
      subjects,
      completedHours,
      totalHours,
    });
  }

  // Calculate stats
  let completedHours = 0;
  let mandatoryCompletedHours = 0;
  let electiveCompletedHours = 0;
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

  const mandatoryTotalHours = matrix.mandatoryHours || 2400;
  const electiveTotalHours = matrix.electiveHours || 600;
  const totalMatrixHours = matrix.totalHours || (mandatoryTotalHours + electiveTotalHours);

  const overallCompletionPercentage = Math.min(100, Math.round((completedHours / totalMatrixHours) * 100));
  const mandatoryCompletionPercentage = Math.min(100, Math.round((mandatoryCompletedHours / mandatoryTotalHours) * 100));
  const electiveCompletionPercentage = Math.min(100, Math.round((electiveCompletedHours / electiveTotalHours) * 100));

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

  // Recommended next subjects (UNLOCKED mandatory subjects sorted by lowest period first)
  const nextRecommendedSubjects = analyzedSubjects
    .filter(s => s.status === 'UNLOCKED' && s.type === 'OBRIGATORIA')
    .sort((a, b) => a.period - b.period);

  return {
    studentName: transcript.studentName,
    registration: transcript.registration,
    courseName: transcript.courseName || matrix.courseName,
    cr: transcript.cr,

    totalMatrixHours,
    totalCompletedHours: completedHours,
    mandatoryCompletedHours,
    mandatoryTotalHours,
    electiveCompletedHours,
    electiveTotalHours,
    inProgressHours,

    overallCompletionPercentage,
    mandatoryCompletionPercentage,
    electiveCompletionPercentage,

    completedSubjectsCount,
    inProgressSubjectsCount,
    unlockedSubjectsCount,
    blockedSubjectsCount,
    pendingSubjectsCount,

    estimatedCurrentPeriod,
    nextRecommendedSubjects,
    periodGroups,
  };
}
