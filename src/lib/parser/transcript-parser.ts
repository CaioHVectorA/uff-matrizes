export interface TranscriptRecord {
  code: string;
  name: string;
  workload: number;
  grade?: number;
  gradeRaw?: string; // "7.3", "AC", "DISP", "CURS", etc.
  periodSemester?: string; // e.g. "1º/2024"
  status: 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO';
}

export interface ParsedTranscript {
  studentName?: string;
  registration?: string; // Matrícula
  cpf?: string;
  courseName?: string;
  curriculumCode?: string;
  admissionPeriod?: string;
  qualification?: string; // Habilitação
  emphasis?: string; // Ênfase
  trainingLine?: string; // Linha de Formação
  cr?: number; // Coeficiente de Rendimento
  completedHours?: number; // Carga horária cursada
  records: TranscriptRecord[];
}

/**
 * Normalizes subject status strings from UFF transcripts
 */
export function normalizeStatus(statusRaw: string): 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO' {
  const normalized = statusRaw.trim().toUpperCase();

  if (
    normalized.includes('APROVADO') ||
    normalized.includes('APROV') ||
    normalized === 'AP' ||
    normalized === 'AC' ||
    normalized.includes('ATIVIDADE COMPLEMENTAR')
  ) {
    return 'APROVADO';
  }
  if (
    normalized.includes('DISPENSA') ||
    normalized.includes('DISP') ||
    normalized.includes('APROVEITAMENTO')
  ) {
    return 'DISPENSA';
  }
  if (
    normalized.includes('INSCRITO') ||
    normalized.includes('MATRICULADO') ||
    normalized.includes('EM ANDAMENTO') ||
    normalized.includes('CURSANDO') ||
    normalized === 'CURS' ||
    normalized.includes('CURS')
  ) {
    return 'EM_ANDAMENTO';
  }
  if (
    normalized.includes('REPROVADO') ||
    normalized.includes('REP') ||
    normalized.includes('INFREQUENCIA')
  ) {
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
  let cpf: string | undefined;
  let courseName: string | undefined;
  let curriculumCode: string | undefined;
  let admissionPeriod: string | undefined;
  let qualification: string | undefined;
  let emphasis: string | undefined;
  let trainingLine: string | undefined;
  let cr: number | undefined;
  let completedHours: number | undefined;

  const lines = text.split('\n');

  // Registration / Matrícula Match
  const registrationMatch = text.match(/(?:Matr[íi]cula|MATR[ÍI]CULA UFF)[\s:]*([0-9A-Z\-]{8,15})/i);
  if (registrationMatch) {
    registration = registrationMatch[1].trim();
  } else {
    const fallbackMatr = text.match(/\b(\d{9})\b/);
    if (fallbackMatr) registration = fallbackMatr[1];
  }

  // Habilitação / Ênfase / Linha de Formação Match
  const habMatch = text.match(/HABILITA[ÇC][ÃA]O:\s*([^Ê\n\r]+?)(?=ÊNFASE|LOCALIDADE|TITULAÇÃO|$)/i);
  if (habMatch && habMatch[1].trim() !== '-') qualification = habMatch[1].trim();

  const enfMatch = text.match(/ÊNFASE:\s*([^L\n\r]+?)(?=LINHA|FORMA|LOCALIDADE|$)/i);
  if (enfMatch && enfMatch[1].trim() !== '-') emphasis = enfMatch[1].trim();

  const linMatch = text.match(/LINHA DE FORMA[ÇC][ÃA]O:\s*([^\n\r]+?)(?=FORMA|CURRÍCULO|$)/i);
  if (linMatch && linMatch[1].trim() !== '-') trainingLine = linMatch[1].trim();

  // CPF Match
  const cpfMatch = text.match(/(?:CPF)[\s:]*([0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2})/i);
  if (cpfMatch) {
    cpf = cpfMatch[1].trim();
  }

  // Student Name Match
  const nameMatch = text.match(/(?:NOME DO ALUNO|Nome|Aluno)[\s:]*([^\n\r]+)/i);
  if (nameMatch) {
    studentName = nameMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Course Name Match
  const courseMatch = text.match(/(?:CURSO|Curso)[\s:]*([^\n\r]+)/i);
  if (courseMatch) {
    courseName = courseMatch[1].replace(/HABILITA[ÇC][ÃA]O:.*/i, '').replace(/LOCALIDADE:.*/i, '').trim();
  }

  // Curriculum Code Match
  const currMatch = text.match(/(?:CURR[ÍI]CULO|Curr[íi]culo)[\s:]*([0-9\.\-]+)/i);
  if (currMatch) {
    curriculumCode = currMatch[1].trim();
  }

  // Admission Period Match (e.g. 1º/2024)
  const admMatch = text.match(/(?:PER[ÍI]ODO\/ANO DE INGRESSO|INGRESSO)[\s:]*([12]º?\/20[0-2][0-9])/i);
  if (admMatch) {
    admissionPeriod = admMatch[1].trim();
  }

  // CR Match
  const crMatch = text.match(/(?:C\.?R\.?|COEFICIENTE DE RENDIMENTO)[\s:]*([0-9]+[.,][0-9]+|[0-9]+)/i);
  if (crMatch) {
    const parsedCr = parseFloat(crMatch[1].replace(',', '.'));
    if (!isNaN(parsedCr) && parsedCr <= 10) cr = parsedCr;
  }

  // Carga Horária Cursada Match
  const chCursadaMatch = text.match(/(?:CARGA HOR[ÁA]RIA CURSADA)[\s:]*(\d+)/i);
  if (chCursadaMatch) {
    completedHours = parseInt(chCursadaMatch[1], 10);
  }

  // Regex to extract UFF subject code
  const subjectCodeRegex = /([A-Z]{3}\d{5})/;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    if (!line) continue;

    const codeMatch = line.match(subjectCodeRegex);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();

      // Extract semester if available (e.g. "1º/2024", "2024/1", "1/2024", "2º/2025")
      let periodSemester: string | undefined;
      const semMatch = line.match(/([12]º?\/20[0-2][0-9]|20[0-2][0-9]\/[12])/);
      if (semMatch) {
        periodSemester = semMatch[1];
      }

      // Status extraction
      let status: 'APROVADO' | 'DISPENSA' | 'EM_ANDAMENTO' | 'REPROVADO' | 'CANCELADO' = 'APROVADO';
      let gradeRaw: string | undefined;

      if (/\bAC\b|atividade\s+complementar/i.test(line)) {
        status = 'APROVADO';
        gradeRaw = 'AC';
      } else if (/dispensa|aproveitamento|\bDISP\b/i.test(line)) {
        status = 'DISPENSA';
        gradeRaw = 'DISP';
      } else if (/inscrito|matriculado|cursando|\bCURS\b/i.test(line)) {
        status = 'EM_ANDAMENTO';
        gradeRaw = 'CURS';
      } else if (/reprovado|\bREP\b|infrequ/i.test(line)) {
        status = 'REPROVADO';
      } else if (/cancelado|trancado|\bCANC\b/i.test(line)) {
        status = 'CANCELADO';
      } else if (/aprovado|\bAP\b/i.test(line)) {
        status = 'APROVADO';
      }

      // Extract numeric grade if present
      let grade: number | undefined;
      const gradeMatches = Array.from(line.matchAll(/([0-9]{1,2}[.,][0-9]{1,2})/g));
      if (gradeMatches.length > 0) {
        // Find the grade decimal value
        for (let g = gradeMatches.length - 1; g >= 0; g--) {
          const val = parseFloat(gradeMatches[g][1].replace(',', '.'));
          if (!isNaN(val) && val <= 10.0) {
            grade = val;
            gradeRaw = grade.toFixed(1);
            if (grade >= 6.0 && status !== 'DISPENSA') {
              status = 'APROVADO';
            } else if (grade < 6.0 && status !== 'DISPENSA' && status !== 'EM_ANDAMENTO') {
              status = 'REPROVADO';
            }
            break;
          }
        }
      }

      // Extract numeric workload
      let workload = 60;
      const chMatch = line.match(/\b(15|30|40|45|50|60|68|75|80|90|102|105|120|135|150|165|180|210|240|280)\b/);
      if (chMatch) {
        workload = parseInt(chMatch[1], 10);
      }

      // Clean subject name
      let name = line
        .replace(code, '')
        .replace(/([12]º?\/20[0-2][0-9]|20[0-2][0-9]\/[12])/g, '')
        .replace(/aprovado|dispensa|inscrito|matriculado|reprovado|cancelado|por m[eé]dia|de disciplina|por frequ[eê]ncia|\bCURS\b|\bAC\b|\bDISP\b|\bAP\b/gi, '')
        .replace(/([0-9]{1,2}[.,][0-9]{1,2})/g, '')
        .replace(/\b(15|30|40|45|50|52|60|68|75|80|90|105|120|150|165|180|210|240)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      name = name.replace(/^[\s\d\-\.]+|[\s\d\-\.]+$/g, '').trim();
      if (!name) name = `Disciplina ${code}`;

      // Avoid duplicates with same code: keep highest grade / latest status
      const existing = records.find(r => r.code === code);
      if (!existing) {
        records.push({
          code,
          name,
          workload,
          grade,
          gradeRaw,
          periodSemester,
          status,
        });
      } else if (grade !== undefined && (existing.grade === undefined || grade > existing.grade)) {
        existing.grade = grade;
        existing.gradeRaw = gradeRaw;
        existing.status = status;
        if (periodSemester) existing.periodSemester = periodSemester;
      }
    }
  }

  return {
    studentName,
    registration,
    cpf,
    courseName,
    curriculumCode,
    admissionPeriod,
    cr,
    completedHours,
    records,
  };
}

