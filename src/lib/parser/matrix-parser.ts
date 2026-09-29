import { MatrixRawData, SubjectRawData } from '../scraper/uff-scraper';

/**
 * Extracts prerequisite subject codes from text.
 * E.g., "[1 - GGM00137] FUNDAMENTOS DE CÁLCULO E GEOMETRIA" -> ["GGM00137"]
 * or "GGM00137, GMA00154" -> ["GGM00137", "GMA00154"]
 */
export function extractPrerequisiteCodes(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[A-Z]{3}\d{5}/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map(c => c.toUpperCase())));
}

/**
 * Parses UFF Matriz Curricular raw text (extracted from PDF or pasted text)
 */
export function parseMatrixText(text: string): MatrixRawData {
  let courseName = 'Curso UFF';
  let matrixCode = '1';
  let courseCode = '38.01.003';
  let totalHours = 0;

  // Header Extractions
  const courseMatch = text.match(/Curso:\s*([^\n\r]+)/i);
  if (courseMatch) courseName = courseMatch[1].trim();

  const matrixMatch = text.match(/Curr[íi]culo:\s*([^\n\r]+)/i);
  if (matrixMatch) courseCode = matrixMatch[1].trim();

  const totalHoursMatch = text.match(/Carga hor[áa]ria total:\s*(\d+)/i);
  if (totalHoursMatch) totalHours = parseInt(totalHoursMatch[1], 10);

  const subjects: SubjectRawData[] = [];
  const lines = text.split('\n');

  let currentPeriod = 1;
  const subjectCodeRegex = /\b([A-Z]{3}\d{5})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect period headers
    const periodMatch = line.match(/(\d+)º?\s*per[íi]odo/i);
    if (periodMatch) {
      currentPeriod = parseInt(periodMatch[1], 10);
      continue;
    }

    if (/n[aã]o\s+periodizada|optativas|eletivas/i.test(line) && !line.match(subjectCodeRegex)) {
      currentPeriod = 0; // 0 for non-periodized/electives
      continue;
    }

    // Match subject code line
    const codeMatch = line.match(subjectCodeRegex);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();

      // Look ahead a few lines to combine multi-line subject description/prerequisites
      let combinedText = line;
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        // Stop if next line is another subject code, header, or period header
        if (!nextLine || nextLine.match(subjectCodeRegex) || /º?\s*per[íi]odo/i.test(nextLine) || /Gerado em/i.test(nextLine)) {
          break;
        }
        combinedText += ' ' + nextLine;
        j++;
      }

      // Type extraction (OB = Obrigatória, O = Optativa, E = Escolha/Eletiva)
      let type: 'OBRIGATORIA' | 'OPTATIVA' | 'ELETIVA' = 'OBRIGATORIA';
      if (/\bOB\b/i.test(combinedText)) {
        type = 'OBRIGATORIA';
      } else if (/\b(O|OPT|OPTATIVA)\b/i.test(combinedText) && !/\bOB\b/i.test(combinedText)) {
        type = 'OPTATIVA';
      } else if (/\b(E|ELE|ELETIVA)\b/i.test(combinedText)) {
        type = 'ELETIVA';
      }

      // Workload extraction
      let workload = 60;
      const chMatch = combinedText.match(/\b(15|30|45|60|75|90|105|120|135|150|165|180|210|240|280|510)\b/);
      if (chMatch) {
        workload = parseInt(chMatch[1], 10);
      }

      // Subject name extraction: extract portion between subject code and subject type / numbers / brackets
      let name = '';
      const nameMatch = combinedText.match(new RegExp(`${code}\\s+(.*?)\\s+(?:OB|O|E|EL|\\d{2,3}\\s+\\d+)`, 'i'));
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
      } else {
        name = combinedText
          .replace(code, '')
          .replace(/\[[^\]]+\]/g, '') // remove [1 - GGM00137] brackets
          .replace(/Gerado em:.*|Este documento foi.*|REL\d+|MATRIZ CURRICULAR/gi, '')
          .replace(/\b(OB|O|E|EL|CHT|CHP|CHEs|CHTotal|CHEx|CHPre-Req|Pré-requisitos|Co-requisitos)\b/gi, '')
          .replace(/\b\d+\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Remove any trailing numbers or brackets
      name = name.replace(/\[[^\]]+\]/g, '').replace(/\b(OB|O|E|EL)\b/gi, '').replace(/\s+/g, ' ').trim();

      if (!name || name.length < 3) {
        name = `Disciplina ${code}`;
      }

      // Prerequisites extraction: extract codes found in brackets or prerequisite text, excluding subject's own code
      const prereqCodes = extractPrerequisiteCodes(combinedText).filter(c => c !== code);

      // Check if already added
      const existingIdx = subjects.findIndex(s => s.code === code);
      if (existingIdx === -1) {
        subjects.push({
          code,
          name,
          period: currentPeriod,
          workload,
          type,
          prerequisites: prereqCodes,
        });
      }
    }
  }

  // Calculate hours if totalHours was not in header
  const mandatoryHours = subjects
    .filter(s => s.type === 'OBRIGATORIA')
    .reduce((acc, s) => acc + s.workload, 0);
  const electiveHours = subjects
    .filter(s => s.type !== 'OBRIGATORIA')
    .reduce((acc, s) => acc + s.workload, 0);

  if (!totalHours) {
    totalHours = mandatoryHours + electiveHours;
  }

  return {
    courseCode,
    courseName,
    matrixCode,
    matrixName: `Matriz Curricular ${courseName}`,
    totalHours,
    mandatoryHours,
    electiveHours,
    subjects,
  };
}
