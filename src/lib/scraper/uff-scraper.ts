export interface SubjectRawData {
  code: string;
  name: string;
  period: number; // 1, 2, ..., 0 for Electives/Optativas
  workload: number; // hours (e.g. 60)
  type: 'OBRIGATORIA' | 'OPTATIVA' | 'ELETIVA';
  prerequisites: string[]; // Subject codes required
  corequisites?: string[];
  department?: string;
}

export interface MatrixRawData {
  courseCode: string;
  courseName: string;
  matrixCode: string;
  matrixName: string;
  campus?: string;
  degree?: string;
  totalHours: number;
  mandatoryHours: number;
  electiveHours: number;
  subjects: SubjectRawData[];
}

/**
 * Parses prerequisite strings from UFF matrix HTML / text (e.g., "TCC00288, TCC00289" or "Sem Pré-requisito" or "TCC00288 (OU TCC00200)")
 */
export function parsePrerequisites(prereqStr: string | null | undefined): string[] {
  if (!prereqStr) return [];
  const cleanStr = prereqStr.trim();
  if (!cleanStr || cleanStr.toLowerCase().includes('sem pré') || cleanStr.toLowerCase().includes('sem pre') || cleanStr === '-') {
    return [];
  }

  // Extract all code patterns like TCC00123, GAN00021, EUT00001, etc.
  const codeMatches = cleanStr.match(/[A-Z]{3}\d{5}/gi);
  if (!codeMatches) return [];

  // Deduplicate and upper case
  return Array.from(new Set(codeMatches.map(c => c.toUpperCase())));
}

/**
 * Parses raw HTML content from UFF Matriz Curricular pages (app.uff.br or cached HTML)
 */
export function parseUFFMatrixHTML(htmlContent: string): MatrixRawData {
  const subjects: SubjectRawData[] = [];

  // Extract course name & matrix code if present
  let courseName = 'Curso UFF';
  let matrixCode = '2023.1';
  let courseCode = 'UFF001';

  const titleMatch = htmlContent.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
  if (titleMatch) {
    const rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    if (rawTitle) courseName = rawTitle;
  }

  const matrixCodeMatch = htmlContent.match(/(?:matriz|curriculo|vers[aã]o)[\s:]*([0-9\.\-]+)/i);
  if (matrixCodeMatch) {
    matrixCode = matrixCodeMatch[1];
  }

  // Regex strategy for HTML tables or list items containing subject rows
  // Typical UFF table columns: [Período / Código / Nome / Carga Horária / Tipo / Pré-requisito]
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(htmlContent)) !== null) {
    const trContent = trMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch: RegExpExecArray | null;

    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      // Strip HTML tags and clean whitespace
      const cellText = tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      cells.push(cellText);
    }

    if (cells.length >= 4) {
      // Look for a subject code pattern (3 letters + 5 numbers e.g. TCC00325)
      let subjectCode = '';
      let codeIdx = -1;

      for (let i = 0; i < cells.length; i++) {
        const codeM = cells[i].match(/\b([A-Z]{3}\d{5})\b/i);
        if (codeM) {
          subjectCode = codeM[1].toUpperCase();
          codeIdx = i;
          break;
        }
      }

      if (subjectCode && codeIdx !== -1) {
        // Infer fields based on codeIdx position
        let period = 1;
        let name = '';
        let workload = 60;
        let type: 'OBRIGATORIA' | 'OPTATIVA' | 'ELETIVA' = 'OBRIGATORIA';
        let prereqStr = '';

        // Check if preceding cell is period
        if (codeIdx > 0) {
          const pVal = parseInt(cells[codeIdx - 1], 10);
          if (!isNaN(pVal) && pVal >= 0 && pVal <= 12) {
            period = pVal;
          }
        }

        // Following cell is usually subject name
        if (codeIdx + 1 < cells.length) {
          name = cells[codeIdx + 1];
        }

        // Next cells: workload, type, prerequisites
        for (let j = codeIdx + 2; j < cells.length; j++) {
          const val = cells[j];
          if (/^\d{2,3}$/.test(val)) {
            workload = parseInt(val, 10);
          } else if (/optativa|opt|eletiva/i.test(val)) {
            type = 'OPTATIVA';
          } else if (/obrigat[oó]ria|obrig/i.test(val)) {
            type = 'OBRIGATORIA';
          } else if (/[A-Z]{3}\d{5}|sem pr[eé]/i.test(val)) {
            prereqStr = val;
          }
        }

        if (name) {
          subjects.push({
            code: subjectCode,
            name,
            period,
            workload: workload || 60,
            type,
            prerequisites: parsePrerequisites(prereqStr),
          });
        }
      }
    }
  }

  // Calculate total hours
  const mandatoryHours = subjects
    .filter(s => s.type === 'OBRIGATORIA')
    .reduce((acc, s) => acc + s.workload, 0);
  const electiveHours = subjects
    .filter(s => s.type !== 'OBRIGATORIA')
    .reduce((acc, s) => acc + s.workload, 0);

  return {
    courseCode,
    courseName,
    matrixCode,
    matrixName: `Matriz Curricular ${matrixCode}`,
    totalHours: mandatoryHours + electiveHours,
    mandatoryHours,
    electiveHours,
    subjects,
  };
}
