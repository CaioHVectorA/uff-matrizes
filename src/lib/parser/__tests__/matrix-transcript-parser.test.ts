import test from 'node:test';
import assert from 'node:assert';
import { parseMatrixText } from '../matrix-parser';
import { parseTranscriptText } from '../transcript-parser';
import { analyzeStudentProgress, detectEquivalenceCandidates } from '../../analytics/matrix-analyzer';
import { SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT } from '../../data/sample-data';

test('parseMatrixText parses UFF Engenharia Elétrica matrix text correctly', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);

  assert.strictEqual(matrix.courseName, 'ENGENHARIA ELÉTRICA');
  assert.ok(matrix.subjects.length >= 35, `Should parse full matrix subjects, got ${matrix.subjects.length}`);

  // Check GGM00137 (FUNDAMENTOS DE CÁLCULO E GEOMETRIA)
  const ggm = matrix.subjects.find(s => s.code === 'GGM00137');
  assert.ok(ggm, 'GGM00137 should exist');
  assert.strictEqual(ggm?.period, 1);
  assert.strictEqual(ggm?.type, 'OBRIGATORIA');

  // Check GMA00154 (CÁLCULO 1) prerequisites
  const calc1 = matrix.subjects.find(s => s.code === 'GMA00154');
  assert.ok(calc1, 'GMA00154 should exist');
  assert.ok(calc1?.prerequisites.includes('GGM00137'), 'Cálculo 1 should have GGM00137 as prerequisite');

  // Check GMA00155 (CÁLCULO 2) prerequisites
  const calc2 = matrix.subjects.find(s => s.code === 'GMA00155');
  assert.ok(calc2, 'GMA00155 should exist');
  assert.ok(calc2?.prerequisites.includes('GAN00140'), 'Cálculo 2 should have GAN00140');
  assert.ok(calc2?.prerequisites.includes('GMA00154'), 'Cálculo 2 should have GMA00154');
});

test('parseTranscriptText parses demonstration transcript text correctly', () => {
  const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);

  assert.strictEqual(transcript.studentName, 'ESTUDANTE DEMONSTRAÇÃO');
  assert.strictEqual(transcript.registration, '120000000');
  assert.strictEqual(transcript.cpf, '000.000.000-00');
  assert.strictEqual(transcript.cr, 7.0);
  assert.strictEqual(transcript.completedHours, 1273);
  assert.ok(transcript.records.length >= 20, `Should parse all transcript records, got ${transcript.records.length}`);

  // Check GGM00137 grade
  const ggmRecord = transcript.records.find(r => r.code === 'GGM00137');
  assert.ok(ggmRecord, 'GGM00137 record should exist');
  assert.strictEqual(ggmRecord?.grade, 7.3);
  assert.strictEqual(ggmRecord?.status, 'APROVADO');

  // Check AC record
  const acRecord = transcript.records.find(r => r.code === 'TGE00007');
  assert.ok(acRecord, 'TGE00007 should exist');
  assert.strictEqual(acRecord?.status, 'APROVADO');
  assert.strictEqual(acRecord?.gradeRaw, 'AC');
});

test('analyzeStudentProgress accurately identifies completed, unlocked, and blocked subjects and builds graph edges', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
  const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);
  const analysis = analyzeStudentProgress(matrix, transcript);

  assert.strictEqual(analysis.studentName, 'ESTUDANTE DEMONSTRAÇÃO');
  assert.strictEqual(analysis.registration, '120000000');
  assert.strictEqual(analysis.cr, 7.0);

  assert.ok(analysis.completedSubjectsCount > 0, 'Should have completed subjects');
  assert.ok(analysis.overallCompletionPercentage > 0, 'Completion percentage should be > 0');
  assert.ok(analysis.edges.length > 0, 'Should generate graph edges for canvas flowchart');

  // Check GGM00137 is COMPLETED
  const allSubjects = analysis.periodGroups.flatMap(g => g.subjects);
  const ggm = allSubjects.find(s => s.code === 'GGM00137');
  assert.strictEqual(ggm?.status, 'COMPLETED');

  // Check Cálculo 2 (GMA00155) is COMPLETED
  const calc2 = allSubjects.find(s => s.code === 'GMA00155');
  assert.strictEqual(calc2?.status, 'COMPLETED');

  // Check Física III (GFI00160) is UNLOCKED (since Física I is completed)
  const fis3 = allSubjects.find(s => s.code === 'GFI00160');
  assert.strictEqual(fis3?.status, 'UNLOCKED');

  // Check Cálculo 3 (GMA00156) is UNLOCKED (since Álgebra Linear & Cálculo 2 are completed)
  const calc3 = allSubjects.find(s => s.code === 'GMA00156');
  assert.strictEqual(calc3?.status, 'UNLOCKED');
});

test('analyzeStudentProgress correctly applies subject equivalences and unlocks downstream prerequisites', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
  const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);

  // Analyze with default UFF equivalences (TEC00204 is in transcript, GFI00141 is in matrix)
  const analysis = analyzeStudentProgress(matrix, transcript);
  const allSubjects = analysis.periodGroups.flatMap(g => g.subjects);

  // 1. Mecânica Geral V (GFI00141) should be COMPLETED by equivalence with TEC00204 (Mecânica dos Corpos Rígidos)
  const mecGeral = allSubjects.find(s => s.code === 'GFI00141');
  assert.ok(mecGeral, 'GFI00141 should exist in analyzed matrix');
  assert.strictEqual(mecGeral?.status, 'COMPLETED', 'GFI00141 should be COMPLETED due to equivalence with TEC00204');
  assert.strictEqual(mecGeral?.isEquivalent, true);
  assert.strictEqual(mecGeral?.equivalenceInfo?.equivalentCode, 'TEC00204');
  assert.strictEqual(mecGeral?.grade, 6.1);

  // 2. Downstream subject: Resistência dos Materiais (TEM00177) has GFI00141 as prerequisite.
  // Since GFI00141 is satisfied by equivalence, TEM00177 should be UNLOCKED!
  const resMat = allSubjects.find(s => s.code === 'TEM00177');
  assert.ok(resMat, 'TEM00177 should exist');
  assert.strictEqual(resMat?.status, 'UNLOCKED', 'TEM00177 should be UNLOCKED because its prerequisite GFI00141 was satisfied by equivalence');

  // 3. TEC00204 should NOT be duplicated as an orphan in Period 0
  const period0Subjects = analysis.periodGroups.find(g => g.period === 0)?.subjects || [];
  const orphanTec = period0Subjects.find(s => s.code === 'TEC00204');
  assert.strictEqual(orphanTec, undefined, 'TEC00204 should not be duplicated in Period 0 since it was consumed by GFI00141 equivalence');
});

test('detectEquivalenceCandidates discovers potential equivalences with score and unlocks information', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
  const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);

  const candidates = detectEquivalenceCandidates(matrix, transcript);
  assert.ok(candidates.length > 0, 'Should detect at least 1 candidate equivalence');

  const mecCandidate = candidates.find(c => c.matrixCode === 'GFI00141' && c.transcriptCode === 'TEC00204');
  assert.ok(mecCandidate, 'Should find GFI00141 <-> TEC00204 candidate');
  assert.strictEqual(mecCandidate?.matchScore, 98);
  assert.ok(mecCandidate?.unlocksCount && mecCandidate.unlocksCount > 0, 'Should identify downstream unlocks');
});

test('iduff-matrix-service helpers decode entities and match course names accurately', () => {
  const { decodeHtmlEntities, findCourseByTranscript } = require('../../scraper/iduff-matrix-service');

  assert.strictEqual(decodeHtmlEntities('ADMINISTRA&Ccedil;&Atilde;O'), 'ADMINISTRAÇÃO');
  assert.strictEqual(decodeHtmlEntities('CI&Ecirc;NCIA'), 'CIÊNCIA');

  const mockCourses = [
    { value: '23 - ADMINISTRAÇÃO', label: '23 - ADMINISTRAÇÃO' },
    { value: '38 - ENGENHARIA ELÉTRICA', label: '38 - ENGENHARIA ELÉTRICA' },
    { value: '31 - CIÊNCIA DA COMPUTAÇÃO', label: '31 - CIÊNCIA DA COMPUTAÇÃO' },
    { value: '07 - DIREITO', label: '07 - DIREITO' },
  ];

  const matchedEletrica = findCourseByTranscript('ENGENHARIA ELÉTRICA', mockCourses);
  assert.strictEqual(matchedEletrica?.value, '38 - ENGENHARIA ELÉTRICA');

  const matchedComp = findCourseByTranscript('Ciência da Computação', mockCourses);
  assert.strictEqual(matchedComp?.value, '31 - CIÊNCIA DA COMPUTAÇÃO');

  const matchedDireito = findCourseByTranscript('Direito', mockCourses);
  assert.strictEqual(matchedDireito?.value, '07 - DIREITO');
});
