import { test } from 'node:test';
import assert from 'node:assert';
import { parseMatrixText } from '../../parser/matrix-parser';
import { parseTranscriptText } from '../../parser/transcript-parser';
import { analyzeStudentProgress } from '../matrix-analyzer';
import { SAMPLE_MATRIX_TEXT, SAMPLE_TRANSCRIPT_TEXT } from '../../data/sample-data';

test('analyzeStudentProgress works when transcript is null/absent (manual mode)', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
  assert.ok(matrix.subjects.length > 0);

  // Analyze with no transcript
  const summary = analyzeStudentProgress(matrix, null);

  assert.strictEqual(summary.studentName, 'Estudante (Seleção Manual)');
  assert.strictEqual(summary.completedSubjectsCount, 0);
  assert.strictEqual(summary.totalCompletedHours, 0);
  assert.strictEqual(summary.overallCompletionPercentage, 0);
  assert.ok(summary.unlockedSubjectsCount > 0, 'Subjects without prerequisites should be unlocked');
  assert.ok(summary.blockedSubjectsCount > 0, 'Subjects with missing prerequisites should be blocked');

  // GGM00137 has no prerequisites in period 1 -> should be UNLOCKED
  const ggm = summary.periodGroups.flatMap(g => g.subjects).find(s => s.code === 'GGM00137');
  assert.ok(ggm);
  assert.strictEqual(ggm.status, 'UNLOCKED');

  // GMA00154 depends on GGM00137 -> should be BLOCKED
  const gma = summary.periodGroups.flatMap(g => g.subjects).find(s => s.code === 'GMA00154');
  assert.ok(gma);
  assert.strictEqual(gma.status, 'BLOCKED');
});

test('manualStatusMap dynamically unlocks downstream prerequisites when transcript is absent', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);

  // Manually mark GGM00137 as COMPLETED
  const manualStatusMap: Record<string, 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'> = {
    GGM00137: 'COMPLETED',
  };

  const summary = analyzeStudentProgress(matrix, null, undefined, manualStatusMap);

  assert.strictEqual(summary.completedSubjectsCount, 1);
  assert.ok(summary.totalCompletedHours > 0);

  // GGM00137 is now COMPLETED and flagged as manual override
  const ggm = summary.periodGroups.flatMap(g => g.subjects).find(s => s.code === 'GGM00137');
  assert.ok(ggm);
  assert.strictEqual(ggm.status, 'COMPLETED');
  assert.strictEqual(ggm.isManualOverride, true);
  assert.strictEqual(ggm.manualStatus, 'COMPLETED');

  // GMA00154 depends on GGM00137 -> should now be UNLOCKED!
  const gma = summary.periodGroups.flatMap(g => g.subjects).find(s => s.code === 'GMA00154');
  assert.ok(gma);
  assert.strictEqual(gma.status, 'UNLOCKED', 'GMA00154 must be unlocked when GGM00137 is marked completed');
});

test('manualStatusMap allows marking in progress and overriding transcript results', () => {
  const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
  const transcript = parseTranscriptText(SAMPLE_TRANSCRIPT_TEXT);

  // Override: Mark an uncompleted subject as IN_PROGRESS manually
  const manualStatusMap: Record<string, 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'> = {
    TEE00189: 'IN_PROGRESS',
  };

  const summary = analyzeStudentProgress(matrix, transcript, undefined, manualStatusMap);

  const tee189 = summary.periodGroups.flatMap(g => g.subjects).find(s => s.code === 'TEE00189');
  if (tee189) {
    assert.strictEqual(tee189.status, 'IN_PROGRESS');
    assert.strictEqual(tee189.isManualOverride, true);
  }
});
