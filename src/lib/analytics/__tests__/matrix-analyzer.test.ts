import assert from 'node:assert';
import test from 'node:test';
import { BUILTIN_UFF_MATRICES } from '../../scraper/builtin-matrices';
import { parseTranscriptText } from '../../parser/transcript-parser';
import { analyzeStudentProgress } from '../matrix-analyzer';

test('BUILTIN_UFF_MATRICES has required courses loaded statically', () => {
  assert.ok(BUILTIN_UFF_MATRICES['ciencia-da-computacao'], 'CC matrix exists');
  assert.ok(BUILTIN_UFF_MATRICES['sistemas-de-informacao'], 'SI matrix exists');
  assert.ok(BUILTIN_UFF_MATRICES['engenharia-de-software'], 'ES matrix exists');

  const cc = BUILTIN_UFF_MATRICES['ciencia-da-computacao'];
  assert.strictEqual(cc.courseCode, 'TCC-CC');
  assert.ok(cc.subjects.length > 20, 'CC should have multiple subjects');
});

test('parseTranscriptText correctly parses transcript text input', () => {
  const sampleText = `UNIVERSIDADE FEDERAL FLUMINENSE
HISTÓRICO ESCOLAR
Nome: Gabriel Santos
Matrícula: 122083042
Curso: Ciência da Computação
CR: 8.4

TCC00288 PROGRAMAÇÃO DE COMPUTADORES I 60 9.0 2022/1 Aprovado
GAN00021 CÁLCULO DIFERENCIAL E INTEGRAL I 90 8.5 2022/1 Aprovado
TCC00289 PROGRAMAÇÃO DE COMPUTADORES II 60 -- 2022/2 Inscrito
`;

  const parsed = parseTranscriptText(sampleText);
  assert.strictEqual(parsed.registration, '122083042');
  assert.strictEqual(parsed.studentName, 'Gabriel Santos');
  assert.strictEqual(parsed.cr, 8.4);
  assert.strictEqual(parsed.records.length, 3);

  const prog1 = parsed.records.find(r => r.code === 'TCC00288');
  assert.ok(prog1);
  assert.strictEqual(prog1?.status, 'APROVADO');
  assert.strictEqual(prog1?.grade, 9.0);

  const prog2 = parsed.records.find(r => r.code === 'TCC00289');
  assert.ok(prog2);
  assert.strictEqual(prog2?.status, 'EM_ANDAMENTO');
});

test('analyzeStudentProgress accurately calculates completion percentages and recommendations', () => {
  const ccMatrix = BUILTIN_UFF_MATRICES['ciencia-da-computacao'];
  const transcript = {
    studentName: 'Gabriel Santos',
    registration: '122083042',
    cr: 8.5,
    records: [
      { code: 'TCC00288', name: 'Programação de Computadores I', workload: 60, grade: 9.0, status: 'APROVADO' as const },
      { code: 'GAN00021', name: 'Cálculo I', workload: 90, grade: 8.5, status: 'APROVADO' as const },
    ],
  };

  const result = analyzeStudentProgress(ccMatrix, transcript);
  assert.strictEqual(result.totalCompletedHours, 150);
  assert.ok(result.overallCompletionPercentage > 0);

  // Since TCC00288 is completed, TCC00289 and TCC00290 should be unlocked
  const unlockedCodes = result.nextRecommendedSubjects.map(s => s.code);
  assert.ok(unlockedCodes.includes('TCC00289'), 'TCC00289 should be recommended/unlocked');
  assert.ok(unlockedCodes.includes('TCC00290'), 'TCC00290 should be recommended/unlocked');
});
