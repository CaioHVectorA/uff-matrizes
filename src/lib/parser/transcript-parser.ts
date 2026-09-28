export interface TranscriptRecord {
  code: string;
  name: string;
  workload: number;
  grade?: number;
  periodSemester?: string; // e.g. "2022/1"
  status: 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO';
}

export interface ParsedTranscript {
  studentName?: string;
  registration?: string; // Matrícula
  courseName?: string;
  cr?: number; // Coefficient of Rendimento
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
  if (normalized.includes('INSCRITO') || normalized.includes('MATRICULADO') || normalized.includes('EM ANDAMENTO') || normalized.includes('CURSANDO')) {
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

  // Single-line field extractions
  const registrationMatch = text.match(/(?:Matr[íi]cula|Inscri[çc][ãa]o)[\s:]*([0-9A-Z\-]{8,15})/i);
  if (registrationMatch) registration = registrationMatch[1];

  const crMatch = text.match(/(?:C\.?R\.?|Coeficiente de Rendimento)[\s:]*([0-9]+[.,][0-9]+|[0-9]+)/i);
  if (crMatch) {
    const parsedCr = parseFloat(crMatch[1].replace(',', '.'));
    if (!isNaN(parsedCr) && parsedCr <= 10) cr = parsedCr;
  }

  for (const line of lines) {
    const lineTrimmed = line.trim();

    if (lineTrimmed.toLowerCase().startsWith('nome:') || lineTrimmed.toLowerCase().startsWith('aluno')) {
      const parts = lineTrimmed.split(':');
      if (parts.length > 1) studentName = parts[1].trim();
    }
    if (lineTrimmed.toLowerCase().startsWith('curso:')) {
      const parts = lineTrimmed.split(':');
      if (parts.length > 1) courseName = parts[1].trim();
    }
  }

  // Regex to extract UFF subject line entry in transcript
  const subjectCodeRegex = /\b([A-Z]{3}\d{5})\b/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const codeMatch = trimmed.match(subjectCodeRegex);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();

      // Find status keywords
      let status: 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO' = 'APROVADO';
      if (/dispensa|aproveitamento/i.test(trimmed)) {
        status = 'DISPENSA';
      } else if (/inscrito|matriculado|cursando/i.test(trimmed)) {
        status = 'EM_ANDAMENTO';
      } else if (/reprovado|infrequ/i.test(trimmed)) {
        status = 'REPROVADO';
      } else if (/cancelado|trancado/i.test(trimmed)) {
        status = 'CANCELADO';
      } else if (/aprovado/i.test(trimmed)) {
        status = 'APROVADO';
      }

      // Extract numeric workload
      let workload = 60;
      const chMatch = trimmed.match(/\b(30|45|60|75|90|105|120|150|180|210|240)\b/);
      if (chMatch) {
        workload = parseInt(chMatch[1], 10);
      }

      // Extract grade if available
      let grade: number | undefined;
      const gradeMatch = trimmed.match(/\b([0-9]{1,2}[.,][0-9]{1,2})\b/);
      if (gradeMatch && status === 'APROVADO') {
        const val = parseFloat(gradeMatch[1].replace(',', '.'));
        if (val <= 10) grade = val;
      }

      // Extract semester if available
      let periodSemester: string | undefined;
      const semMatch = trimmed.match(/\b(20[0-2][0-9][\/.][12])\b/);
      if (semMatch) {
        periodSemester = semMatch[1];
      }

      // Extract subject name by removing code, numbers, and status keywords
      let name = trimmed
        .replace(code, '')
        .replace(/\b(20[0-2][0-9][\/.][12])\b/g, '')
        .replace(/\b(30|45|60|75|90|105|120|150|180|210|240)\b/g, '')
        .replace(/aprovado|dispensa|inscrito|matriculado|reprovado|cancelado|por m[eé]dia|de disciplina|por frequ[eê]ncia|--/gi, '')
        .replace(/[0-9]{1,2}[.,][0-9]{1,2}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!name) name = `Disciplina ${code}`;

      records.push({
        code,
        name,
        workload,
        grade,
        periodSemester,
        status,
      });
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
