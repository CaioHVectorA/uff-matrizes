import test from 'node:test';
import assert from 'node:assert';
import { parseMatrixText } from '../matrix-parser';
import { parseTranscriptText } from '../transcript-parser';
import { analyzeStudentProgress } from '../../analytics/matrix-analyzer';
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

test('parseTranscriptText parses Caio Henrique transcript text correctly', () => {
  const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);

  assert.strictEqual(transcript.studentName, 'CAIO HENRIQUE OLIVEIRA BATISTA');
  assert.strictEqual(transcript.registration, '124038028');
  assert.strictEqual(transcript.cpf, '16635415742');
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

  assert.strictEqual(analysis.studentName, 'CAIO HENRIQUE OLIVEIRA BATISTA');
  assert.strictEqual(analysis.registration, '124038028');
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

