import { MatrixRawData, SubjectRawData } from '../scraper/uff-scraper';
import { ParsedTranscript, TranscriptRecord } from '../parser/transcript-parser';

export type DisplaySubjectStatus = 'COMPLETED' | 'IN_PROGRESS' | 'UNLOCKED' | 'BLOCKED' | 'PENDING';

export interface FlowchartEdge {
  from: string; // Prerequisite subject code
  to: string; // Dependent subject code
  type: 'PREREQUISITE' | 'COREQUISITE';
}

export interface SubjectEquivalenceInfo {
  equivalentCode: string;
  equivalentName: string;
  grade?: number;
  gradeRaw?: string;
  periodSemester?: string;
  isAutoMatched?: boolean;
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
  isEquivalent?: boolean;
  equivalenceInfo?: SubjectEquivalenceInfo;
}

export interface MatrixPeriodGroup {
  period: number; // 0 for Electives/Optativas/AC, 1..N for semesters
  title: string;
  subjects: SubjectAnalysisItem[];
  completedHours: number;
  totalHours: number;
}

export interface ActiveEquivalenceEntry {
  matrixCode: string;
  matrixName: string;
  transcriptCode: string;
  transcriptName: string;
  grade?: number;
  gradeRaw?: string;
  isAutoMatched?: boolean;
}

export interface DetectedEquivalenceCandidate {
  matrixCode: string;
  matrixName: string;
  matrixPeriod: number;
  matrixWorkload: number;
  transcriptCode: string;
  transcriptName: string;
  transcriptWorkload: number;
  transcriptGradeRaw?: string;
  transcriptGrade?: number;
  transcriptPeriodSemester?: string;
  matchScore: number; // 0 to 100
  matchReason: string;
  unlocksCount: number;
  unlocksNames: string[];
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

  // Equivalences
  activeEquivalences: ActiveEquivalenceEntry[];
  availableCompletedTranscriptRecords: TranscriptRecord[];
  detectedEquivalenceCandidates: DetectedEquivalenceCandidate[];
}

/**
 * Built-in dictionary of well-known UFF subject equivalences (especially Engineering / Exact Sciences).
 * Keys are uppercase Matrix codes; values are lists of equivalent subject codes.
 */
export const DEFAULT_UFF_EQUIVALENCES: Record<string, string[]> = {
  // Mecânica Geral V <-> Mecânica dos Corpos Rígidos (TEC00204 / TEC00037 / etc.)
  'GFI00141': ['TEC00204', 'TEC00037', 'TEC00180', 'TEM00007'],
  'TEC00204': ['GFI00141'],
  // Cálculo
  'GMA00154': ['GMA00108', 'GMA00019', 'GMA00043'], // Cálculo 1 <-> Cálculo I-A / Cálculo I
  'GAN00140': ['GAN00021', 'GAN00007', 'GAN00147'], // Álgebra Linear <-> Álgebra Linear I
  'GMA00155': ['GMA00109', 'GMA00020', 'GMA00044'], // Cálculo 2 <-> Cálculo II-A
  'GMA00156': ['GMA00110', 'GMA00021', 'GMA00045'], // Cálculo 3 <-> Cálculo III-A
  'GMA00158': ['GMA00111', 'GMA00022', 'GMA00046'], // Cálculo 4 <-> Cálculo IV-A
  // Física
  'GFI00158': ['GFI00118', 'GFI00120', 'GFI00131'], // Física I <-> Física Teórica e Experimental I
  'GFI00159': ['GFI00119', 'GFI00121', 'GFI00132'], // Física II <-> Física Teórica e Experimental II
  'GFI00160': ['GFI00122', 'GFI00133'],             // Física III <-> Física Teórica e Experimental III
  // Química
  'GQI00048': ['GQI00029', 'GQI00018', 'GQI00030'], // Química Geral
  // Computação
  'TCC00326': ['TCC00308', 'TCC00175', 'TCC00173'], // Prog. Computadores
  'TCC00319': ['TCC00305', 'TCC00174'],             // Estrutura de Dados
  // Estatística
  'GET00177': ['GET00116', 'GET00121', 'GET00179'], // Estatística Básica
  // Termodinâmica & Resistência dos Materiais
  'TEM00275': ['TEM00102', 'TEM00175'],
  'TEM00177': ['TEM00112', 'TEM00176'],
};

/**
 * Universal name normalizer for subject token comparison across all UFF courses.
 */
export function normalizeSubjectName(name: string): string[] {
  if (!name) return [];

  let clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toUpperCase();

  // Convert Roman numerals to digits
  clean = clean
    .replace(/\bXII\b/g, '12')
    .replace(/\bXI\b/g, '11')
    .replace(/\bVIII\b/g, '8')
    .replace(/\bVII\b/g, '7')
    .replace(/\bVI\b/g, '6')
    .replace(/\bIV\b/g, '4')
    .replace(/\bV\b/g, '5')
    .replace(/\bIX\b/g, '9')
    .replace(/\bIII\b/g, '3')
    .replace(/\bII\b/g, '2')
    .replace(/\bI\b/g, '1')
    .replace(/\bX\b/g, '10');

  // Replace punctuation/symbols with spaces
  clean = clean.replace(/[^A-Z0-9\s]/g, ' ');

  // Stopwords in Portuguese
  const stopwords = new Set([
    'DE', 'DO', 'DA', 'DOS', 'DAS', 'E', 'EM', 'PARA', 'COM', 'A', 'O', 'AS', 'OS',
    'TEORICA', 'TEORICO', 'EXPERIMENTAL', 'PRATICA', 'PRATICO', 'GERAL', 'BASICA', 'BASICO',
    'APLICADA', 'APLICADO', 'FUNDAMENTOS', 'INTRODUCAO', 'LABORATORIO', 'CURSO'
  ]);

  const tokens = clean
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !stopwords.has(t));

  return tokens;
}

/**
 * Universal token overlap / similarity calculation.
 */
export function computeNameSimilarity(nameA: string, nameB: string): number {
  const tokensA = new Set(normalizeSubjectName(nameA));
  const tokensB = new Set(normalizeSubjectName(nameB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection += 1.0;
    } else {
      // Partial prefix matching (e.g. MECANIC vs MECANICA, COMPUT vs COMPUTACAO, DIREIT vs DIREITO)
      for (const tokenB of tokensB) {
        if (token.length >= 4 && tokenB.length >= 4) {
          if (token.startsWith(tokenB.slice(0, 4)) || tokenB.startsWith(token.slice(0, 4))) {
            intersection += 0.8;
            break;
          }
        }
      }
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Universal candidate equivalence detector for ANY course.
 */
export function detectEquivalenceCandidates(
  matrix: MatrixRawData,
  transcript: ParsedTranscript,
  customEquivalences?: Record<string, string>
): DetectedEquivalenceCandidate[] {
  const candidates: DetectedEquivalenceCandidate[] = [];
  const matrixCodes = new Set(matrix.subjects.map(s => s.code.toUpperCase().trim()));

  const completedTranscriptRecords = transcript.records.filter(
    r => r.status === 'APROVADO' || r.status === 'DISPENSA'
  );

  // Directly completed matrix codes
  const directlyCompleted = new Set(
    completedTranscriptRecords.map(r => r.code.toUpperCase().trim()).filter(c => matrixCodes.has(c))
  );

  // Transcript records that are NOT directly completing a matrix subject code
  const unmatchedTranscriptRecords = completedTranscriptRecords.filter(
    r => !directlyCompleted.has(r.code.toUpperCase().trim())
  );

  // Downstream dependents map
  const unlocksMap = new Map<string, string[]>();
  for (const s of matrix.subjects) {
    for (const p of s.prerequisites || []) {
      const pUpper = p.toUpperCase().trim();
      if (!unlocksMap.has(pUpper)) unlocksMap.set(pUpper, []);
      unlocksMap.get(pUpper)!.push(s.name);
    }
  }

  for (const mSubject of matrix.subjects) {
    const mCode = mSubject.code.toUpperCase().trim();
    if (directlyCompleted.has(mCode)) continue;

    for (const tRecord of unmatchedTranscriptRecords) {
      const tCode = tRecord.code.toUpperCase().trim();
      if (mCode === tCode) continue;

      // 1. Check known UFF equivalence table
      const knownEquivs = DEFAULT_UFF_EQUIVALENCES[mCode] || [];
      const isKnown = knownEquivs.map(c => c.toUpperCase().trim()).includes(tCode);

      if (isKnown) {
        const unlocks = unlocksMap.get(mCode) || [];
        candidates.push({
          matrixCode: mSubject.code,
          matrixName: mSubject.name,
          matrixPeriod: mSubject.period,
          matrixWorkload: mSubject.workload,
          transcriptCode: tRecord.code,
          transcriptName: tRecord.name,
          transcriptWorkload: tRecord.workload || 60,
          transcriptGradeRaw: tRecord.gradeRaw,
          transcriptGrade: tRecord.grade,
          transcriptPeriodSemester: tRecord.periodSemester,
          matchScore: 98,
          matchReason: 'Equivalência Conhecida da UFF',
          unlocksCount: unlocks.length,
          unlocksNames: unlocks,
        });
        continue;
      }

      // 2. Check Name & Token Similarity
      const similarity = computeNameSimilarity(mSubject.name, tRecord.name);
      const isChAcceptable =
        (tRecord.workload || 60) >= mSubject.workload * 0.7 ||
        Math.abs((tRecord.workload || 60) - mSubject.workload) <= 15;

      if (similarity >= 0.45 && isChAcceptable) {
        const score = Math.min(95, Math.round(similarity * 100));
        const unlocks = unlocksMap.get(mCode) || [];
        candidates.push({
          matrixCode: mSubject.code,
          matrixName: mSubject.name,
          matrixPeriod: mSubject.period,
          matrixWorkload: mSubject.workload,
          transcriptCode: tRecord.code,
          transcriptName: tRecord.name,
          transcriptWorkload: tRecord.workload || 60,
          transcriptGradeRaw: tRecord.gradeRaw,
          transcriptGrade: tRecord.grade,
          transcriptPeriodSemester: tRecord.periodSemester,
          matchScore: score,
          matchReason: `Similaridade de Conteúdo / Nome (${score}%)`,
          unlocksCount: unlocks.length,
          unlocksNames: unlocks,
        });
      }
    }
  }

  // Deduplicate and sort by matchScore descending, then matrixPeriod ascending
  return candidates.sort((a, b) => b.matchScore - a.matchScore || a.matrixPeriod - b.matrixPeriod);
}

/**
 * Aligns student transcript records with a curriculum matrix, applies subject equivalences,
 * and computes progress analytics and dependency graph.
 */
export function analyzeStudentProgress(
  matrix: MatrixRawData,
  transcript: ParsedTranscript,
  customEquivalences?: Record<string, string> // matrixCode -> transcriptCode
): StudentProgressSummary {
  const completedCodes = new Set<string>();
  const inProgressCodes = new Set<string>();
  const recordMap = new Map<string, TranscriptRecord>();

  // Map student records
  for (const record of transcript.records) {
    const upperCode = record.code.toUpperCase().trim();
    recordMap.set(upperCode, record);

    if (record.status === 'APROVADO' || record.status === 'DISPENSA') {
      completedCodes.add(upperCode);
    } else if (record.status === 'EM_ANDAMENTO') {
      inProgressCodes.add(upperCode);
    }
  }

  // All completed records available for manual equivalence selection
  const availableCompletedTranscriptRecords: TranscriptRecord[] = transcript.records.filter(
    r => r.status === 'APROVADO' || r.status === 'DISPENSA'
  );

  // Set of matrix codes
  const matrixCodes = new Set(matrix.subjects.map(s => s.code.toUpperCase().trim()));

  // Process Subject Equivalences
  const activeEquivalences: ActiveEquivalenceEntry[] = [];
  const matrixToEquivalence = new Map<string, SubjectEquivalenceInfo>();
  const consumedTranscriptCodes = new Set<string>();

  // 1. Process custom user-defined equivalences first
  if (customEquivalences) {
    for (const [mCode, tCode] of Object.entries(customEquivalences)) {
      const upperM = mCode.toUpperCase().trim();
      const upperT = tCode.toUpperCase().trim();

      if (upperM && upperT && upperM !== upperT) {
        const tRecord = recordMap.get(upperT);
        const mSubject = matrix.subjects.find(s => s.code.toUpperCase().trim() === upperM);

        if (tRecord) {
          const isCompleted = tRecord.status === 'APROVADO' || tRecord.status === 'DISPENSA';
          const isInProg = tRecord.status === 'EM_ANDAMENTO';

          if (isCompleted) {
            completedCodes.add(upperM);
          } else if (isInProg) {
            inProgressCodes.add(upperM);
          }

          consumedTranscriptCodes.add(upperT);

          const eqInfo: SubjectEquivalenceInfo = {
            equivalentCode: tRecord.code,
            equivalentName: tRecord.name,
            grade: tRecord.grade,
            gradeRaw: tRecord.gradeRaw,
            periodSemester: tRecord.periodSemester,
            isAutoMatched: false,
          };
          matrixToEquivalence.set(upperM, eqInfo);

          activeEquivalences.push({
            matrixCode: upperM,
            matrixName: mSubject?.name || upperM,
            transcriptCode: tRecord.code,
            transcriptName: tRecord.name,
            grade: tRecord.grade,
            gradeRaw: tRecord.gradeRaw,
            isAutoMatched: false,
          });
        }
      }
    }
  }

  // 2. Process automatic known UFF equivalences for remaining uncompleted matrix subjects
  for (const subject of matrix.subjects) {
    const upperM = subject.code.toUpperCase().trim();

    // If matrix subject is not directly completed and has no custom equivalence
    if (!completedCodes.has(upperM) && !inProgressCodes.has(upperM) && !matrixToEquivalence.has(upperM)) {
      const possibleEquivalents = DEFAULT_UFF_EQUIVALENCES[upperM] || [];

      for (const candidateCode of possibleEquivalents) {
        const upperCand = candidateCode.toUpperCase().trim();
        const tRecord = recordMap.get(upperCand);

        if (tRecord && !consumedTranscriptCodes.has(upperCand)) {
          const isCompleted = tRecord.status === 'APROVADO' || tRecord.status === 'DISPENSA';
          const isInProg = tRecord.status === 'EM_ANDAMENTO';

          if (isCompleted || isInProg) {
            if (isCompleted) {
              completedCodes.add(upperM);
            } else {
              inProgressCodes.add(upperM);
            }

            consumedTranscriptCodes.add(upperCand);

            const eqInfo: SubjectEquivalenceInfo = {
              equivalentCode: tRecord.code,
              equivalentName: tRecord.name,
              grade: tRecord.grade,
              gradeRaw: tRecord.gradeRaw,
              periodSemester: tRecord.periodSemester,
              isAutoMatched: true,
            };
            matrixToEquivalence.set(upperM, eqInfo);

            activeEquivalences.push({
              matrixCode: upperM,
              matrixName: subject.name,
              transcriptCode: tRecord.code,
              transcriptName: tRecord.name,
              grade: tRecord.grade,
              gradeRaw: tRecord.gradeRaw,
              isAutoMatched: true,
            });

            break; // Matched first available candidate
          }
        }
      }
    }
  }

  // Calculate current completed hours for CHPre-Req check
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
    const toCode = subject.code.toUpperCase().trim();
    const prereqs = subject.prerequisites || [];
    const coreqs = subject.corequisites || [];

    for (const pCode of prereqs) {
      const pUpper = pCode.toUpperCase().trim();
      if (!unlocksNextMap.has(pUpper)) unlocksNextMap.set(pUpper, []);
      unlocksNextMap.get(pUpper)!.push(toCode);
      edges.push({ from: pUpper, to: toCode, type: 'PREREQUISITE' });
    }

    for (const cCode of coreqs) {
      const cUpper = cCode.toUpperCase().trim();
      if (!unlocksNextMap.has(cUpper)) unlocksNextMap.set(cUpper, []);
      unlocksNextMap.get(cUpper)!.push(toCode);
      edges.push({ from: cUpper, to: toCode, type: 'COREQUISITE' });
    }
  }

  // Check 9th period complete status
  const periods1to9MandatoryCodes = matrix.subjects
    .filter(s => s.period >= 1 && s.period <= 9 && s.type === 'OBRIGATORIA')
    .map(s => s.code.toUpperCase().trim());
  const isPeriod9Complete = periods1to9MandatoryCodes.every(c => completedCodes.has(c));

  const analyzedSubjects: SubjectAnalysisItem[] = [];

  // Analyze each matrix subject
  for (const subject of matrix.subjects) {
    const code = subject.code.toUpperCase().trim();
    const directRecord = recordMap.get(code);
    const eqInfo = matrixToEquivalence.get(code);

    const prereqs = subject.prerequisites || [];
    const coreqs = subject.corequisites || [];

    // Find missing prerequisites
    const missingPrerequisites = prereqs.filter(pCode => !completedCodes.has(pCode.toUpperCase().trim()));
    const missingCorequisites = coreqs.filter(
      cCode => !completedCodes.has(cCode.toUpperCase().trim()) && !inProgressCodes.has(cCode.toUpperCase().trim())
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

    const grade = eqInfo ? eqInfo.grade : directRecord?.grade;
    const gradeRaw = eqInfo ? eqInfo.gradeRaw : directRecord?.gradeRaw;
    const periodSemester = eqInfo ? eqInfo.periodSemester : directRecord?.periodSemester;

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
      grade,
      gradeRaw,
      periodSemester,
      missingPrerequisites,
      missingCorequisites,
      isChPreReqMissing,
      unlocksNext: unlocksNextMap.get(code) || [],
      emphasis: subject.emphasis,
      isEquivalent: !!eqInfo,
      equivalenceInfo: eqInfo,
    });
  }

  // Account for extra completed subjects from transcript that might not be in the matrix
  // (excluding those that have been consumed as equivalences)
  for (const record of transcript.records) {
    const upperCode = record.code.toUpperCase().trim();
    if (
      !matrixCodes.has(upperCode) &&
      !consumedTranscriptCodes.has(upperCode) &&
      (record.status === 'APROVADO' || record.status === 'DISPENSA')
    ) {
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
        isEquivalent: false,
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

  // Detect candidates
  const detectedEquivalenceCandidates = detectEquivalenceCandidates(
    matrix,
    transcript,
    customEquivalences
  );

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

    activeEquivalences,
    availableCompletedTranscriptRecords,
    detectedEquivalenceCandidates,
  };
}
