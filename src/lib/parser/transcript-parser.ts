export interface TranscriptRecord {
  code: string;
  name: string;
  workload: number;
  grade?: number;
  periodSemester?: string; // e.g. "1º/2024"
  status: 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO';
}

export interface ParsedTranscript {
  studentName?: string;
  registration?: string; // Matrícula
  courseName?: string;
  cr?: number; // Coeficiente de Rendimento
  records: TranscriptRecord[];
}

/**
 * Normalizes subject status strings from UFF transcripts
 */
export function normalizeStatus(statusRaw: string): 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO' {
  const normalized = statusRaw.trim().toUpperCase();

  if (normalized.includes('APROVADO') || normalized.includes('APROV') || normalized.includes('AP')) {
    return 'APROVADO';
  }
  if (normalized.includes('DISPENSA') || normalized.includes('DISP') || normalized.includes('APROVEITAMENTO')) {
    return 'DISPENSA';
  }
  if (normalized.includes('INSCRITO') || normalized.includes('MATRICULADO') || normalized.includes('EM ANDAMENTO') || normalized.includes('CURSANDO') || normalized.includes('CURS')) {
    return 'EM_ANDAMENTO';
  }
  if (normalized.includes('REPROVADO') || normalized.includes('REP') || normalized.includes('INFREQUENCIA')) {
    return 'REPROVADO';
  }

  return 'CANCELADO';
}

/**
 * Parses raw plain text from PDF or user text-area input of a UFF Histórico Escolar
 */
export function parseTranscriptText(text: string): ParsedTranscript {
  const records: TranscriptRecord[] = [];
  let studentName: string | undefined;
  let registration: string | undefined;
  let courseName: string | undefined;
  let cr: number | undefined;

  const lines = text.split('\n');

  // Registration / Matrícula Match
  const registrationMatch = text.match(/(?:Matr[íi]cula|MATR[ÍI]CULA UFF)[\s:]*([0-9A-Z\-]{8,15})/i);
  if (registrationMatch) {
    registration = registrationMatch[1].trim();
  } else {
    const fallbackMatr = text.match(/\b(\d{9})\b/);
    if (fallbackMatr) registration = fallbackMatr[1];
  }

  // Student Name Match
  const nameMatch = text.match(/(?:NOME DO ALUNO|Nome|Aluno)[\s:]*([^\n\r]+)/i);
  if (nameMatch) {
    studentName = nameMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Course Name Match
  const courseMatch = text.match(/(?:CURSO|Curso)[\s:]*([^\n\r]+)/i);
  if (courseMatch) {
    courseName = courseMatch[1].replace(/HABILITA[ÇC][ÃA]O:.*/i, '').trim();
  }

  // CR Match
  const crMatch = text.match(/(?:C\.?R\.?|COEFICIENTE DE RENDIMENTO)[\s:]*([0-9]+[.,][0-9]+|[0-9]+)/i);
  if (crMatch) {
    const parsedCr = parseFloat(crMatch[1].replace(',', '.'));
    if (!isNaN(parsedCr) && parsedCr <= 10) cr = parsedCr;
  }

  // Regex to extract UFF subject line entry in transcript (without \b to match concatenated PDF strings)
  const subjectCodeRegex = /([A-Z]{3}\d{5})/;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    if (!line) continue;

    const codeMatch = line.match(subjectCodeRegex);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();

      // Extract semester if available (e.g. "1º/2024", "2024/1", "1/2024")
      let periodSemester: string | undefined;
      const semMatch = line.match(/([12]º?\/20[0-2][0-9]|20[0-2][0-9]\/[12])/);
      if (semMatch) {
        periodSemester = semMatch[1];
      }

      // Status extraction
      let status: 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO' = 'APROVADO';

      if (/dispensa|aproveitamento/i.test(line)) {
        status = 'DISPENSA';
      } else if (/inscrito|matriculado|cursando|\bCURS\b/i.test(line)) {
        status = 'EM_ANDAMENTO';
      } else if (/reprovado|infrequ/i.test(line)) {
        status = 'REPROVADO';
      } else if (/cancelado|trancado/i.test(line)) {
        status = 'CANCELADO';
      } else if (/aprovado/i.test(line)) {
        status = 'APROVADO';
      }

      // Extract numeric grade if present at line end or after subject name
      let grade: number | undefined;
      const gradeMatches = Array.from(line.matchAll(/([0-9]{1,2}[.,][0-9]{1,2})/g));
      if (gradeMatches.length > 0) {
        // Take the last decimal number on the line
        const lastGradeStr = gradeMatches[gradeMatches.length - 1][1].replace(',', '.');
        const val = parseFloat(lastGradeStr);
        if (!isNaN(val) && val <= 10) {
          grade = val;
          if (grade >= 6.0 && status !== 'DISPENSA') {
            status = 'APROVADO';
          }
        }
      }

      // Extract numeric workload
      let workload = 60;
      const chMatch = line.match(/\b(15|30|45|60|68|75|90|105|120|150|180|210|240)\b/);
      if (chMatch) {
        workload = parseInt(chMatch[1], 10);
      }

      // Clean subject name by removing code, dates, numbers, grades, status words
      let name = line
        .replace(code, '')
        .replace(/([12]º?\/20[0-2][0-9]|20[0-2][0-9]\/[12])/g, '')
        .replace(/aprovado|dispensa|inscrito|matriculado|reprovado|cancelado|por m[eé]dia|de disciplina|por frequ[eê]ncia|CURS|AC/gi, '')
        .replace(/([0-9]{1,2}[.,][0-9]{1,2})/g, '')
        .replace(/\b(15|30|45|52|60|68|75|90|105|120|150|180|210|240)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Clean leading/trailing punctuation or isolated single digits
      name = name.replace(/^[\s\d\-\.]+|[\s\d\-\.]+$/g, '').trim();

      if (!name) name = `Disciplina ${code}`;

      // Avoid duplicates with same code
      const existing = records.find(r => r.code === code);
      if (!existing) {
        records.push({
          code,
          name,
          workload,
          grade,
          periodSemester,
          status,
        });
      } else if (grade !== undefined && (existing.grade === undefined || grade > existing.grade)) {
        // Keep highest grade / latest status
        existing.grade = grade;
        existing.status = status;
        if (periodSemester) existing.periodSemester = periodSemester;
      }
    }
  }

  return {
    studentName,
    registration,
    courseName,
    cr,
    records,
  };
}
