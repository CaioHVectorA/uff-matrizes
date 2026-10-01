/**
 * Service to scrape and download official curriculum matrices directly from IdUFF
 * URL: https://app.uff.br/iduff/consultaMatrizCurricular.uff
 */

export interface IdUFFCourseItem {
  value: string;
  label: string;
}

export interface IdUFFCurriculumItem {
  rowIndex: number;
  curriculumCode: string;
  turno: string;
  degree: string;
  qualification: string;
  emphasis: string;
  trainingLine: string;
  buttonName: string;
}

export interface IdUFFCurriculaResult {
  sessionCookie: string;
  viewState: string;
  postUrl: string;
  curricula: IdUFFCurriculumItem[];
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&Agrave;/g, 'À').replace(/&agrave;/g, 'à')
    .replace(/&Aacute;/g, 'Á').replace(/&aacute;/g, 'á')
    .replace(/&Acirc;/g, 'Â').replace(/&acirc;/g, 'â')
    .replace(/&Atilde;/g, 'Ã').replace(/&atilde;/g, 'ã')
    .replace(/&Eacute;/g, 'É').replace(/&eacute;/g, 'é')
    .replace(/&Ecirc;/g, 'Ê').replace(/&ecirc;/g, 'ê')
    .replace(/&Iacute;/g, 'Í').replace(/&iacute;/g, 'í')
    .replace(/&Oacute;/g, 'Ó').replace(/&oacute;/g, 'ó')
    .replace(/&Ocirc;/g, 'Ô').replace(/&ocirc;/g, 'ô')
    .replace(/&Otilde;/g, 'Õ').replace(/&otilde;/g, 'õ')
    .replace(/&Uacute;/g, 'Ú').replace(/&uacute;/g, 'ú')
    .replace(/&Ccedil;/g, 'Ç').replace(/&ccedil;/g, 'ç')
    .replace(/&amp;/g, '&');
}

const IDUFF_URL = 'https://app.uff.br/iduff/consultaMatrizCurricular.uff';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// In-memory cache for courses list (TTL: 1 hour)
let cachedCourses: { data: IdUFFCourseItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Fetches the list of all available undergraduate courses in IdUFF
 */
export async function fetchIdUFFCourses(): Promise<IdUFFCourseItem[]> {
  const now = Date.now();
  if (cachedCourses && (now - cachedCourses.timestamp) < CACHE_TTL_MS) {
    return cachedCourses.data;
  }

  const res = await fetch(IDUFF_URL, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Falha ao conectar com o IdUFF (${res.status} ${res.statusText})`);
  }

  const html = await res.text();
  const matchSelect = html.match(/<select[^>]*id="visualizarCurriculos:cboCursos"[^>]*>([\s\S]*?)<\/select>/i);

  if (!matchSelect) {
    throw new Error('Não foi possível identificar o campo de cursos na página do IdUFF.');
  }

  const optionRegex = /<option\s+value="([^"]+)">([\s\S]*?)<\/option>/gi;
  let match: RegExpExecArray | null;
  const courses: IdUFFCourseItem[] = [];

  while ((match = optionRegex.exec(matchSelect[1])) !== null) {
    const rawVal = match[1];
    const rawLabel = match[2].trim();
    if (!rawVal) continue;

    courses.push({
      value: decodeHtmlEntities(rawVal),
      label: decodeHtmlEntities(rawLabel),
    });
  }

  cachedCourses = { data: courses, timestamp: now };
  return courses;
}

/**
 * Initializes a session and fetches curriculum versions for a specific course
 */
export async function fetchIdUFFCurricula(courseOptionValue: string): Promise<IdUFFCurriculaResult> {
  const initRes = await fetch(IDUFF_URL, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!initRes.ok) {
    throw new Error(`Falha ao conectar com o IdUFF (${initRes.status})`);
  }

  const initHtml = await initRes.text();
  const setCookie = initRes.headers.get('set-cookie');
  const allCookies = initRes.headers.getSetCookie 
    ? initRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') 
    : (setCookie ? setCookie.split(';')[0] : '');

  const matchSession = initHtml.match(/jsessionid=([A-Za-z0-9]+)/);
  const jsessionid = matchSession ? matchSession[1] : '';

  const matchViewState = initHtml.match(/name="javax\.faces\.ViewState"\s+id="javax\.faces\.ViewState"\s+value="([^"]+)"/);
  const viewState = matchViewState ? matchViewState[1] : 'j_id1';

  const postUrl = jsessionid 
    ? `${IDUFF_URL};jsessionid=${jsessionid}`
    : IDUFF_URL;

  // RichFaces 3.3.0 AJAX submit for course selection
  const params = new URLSearchParams();
  params.append('AJAXREQUEST', '_viewRoot');
  params.append('visualizarCurriculos', 'visualizarCurriculos');
  params.append('visualizarCurriculos:cboCursos', courseOptionValue);
  params.append('visualizarCurriculos:j_id15', 'visualizarCurriculos:j_id15');
  params.append('ajaxSingle', 'visualizarCurriculos:cboCursos');
  params.append('javax.faces.ViewState', viewState);

  const ajaxRes = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': allCookies,
      'Faces-Request': 'partial/ajax',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': IDUFF_URL,
    },
    body: params.toString(),
  });

  if (!ajaxRes.ok) {
    throw new Error(`Erro ao consultar currículos do curso no IdUFF (${ajaxRes.status})`);
  }

  const ajaxText = await ajaxRes.text();
  const newViewStateMatch = ajaxText.match(/id="javax\.faces\.ViewState"[^>]*value="([^"]+)"/);
  const finalViewState = newViewStateMatch ? newViewStateMatch[1] : viewState;

  // Extract curriculum rows from table
  // Columns: [Curriculo, Turno, Titulação, Habilitação, Ênfase, Linha de Formação, Baixar Currículo]
  const curricula: IdUFFCurriculumItem[] = [];
  const trRegex = /<tr[^>]*class="[^"]*rich-table-row[^"]*"[^>]*>([\s\S]*?)<\/tr>|<tr[^>]*class="[^"]*rich-table-firstrow[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;
  let rowIndex = 0;

  while ((trMatch = trRegex.exec(ajaxText)) !== null) {
    const rowContent = trMatch[1] || trMatch[2];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch: RegExpExecArray | null;

    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (cells.length >= 6) {
      curricula.push({
        rowIndex,
        curriculumCode: cells[0] || '',
        turno: cells[1] || '',
        degree: decodeHtmlEntities(cells[2] || ''),
        qualification: decodeHtmlEntities(cells[3] || ''),
        emphasis: decodeHtmlEntities(cells[4] || ''),
        trainingLine: decodeHtmlEntities(cells[5] || ''),
        buttonName: `visualizarCurriculos:tabelaCurriculos:${rowIndex}:btnGerenciarCurriculo2`,
      });
      rowIndex++;
    }
  }

  return {
    sessionCookie: allCookies,
    viewState: finalViewState,
    postUrl,
    curricula,
  };
}

/**
 * Downloads the official matrix PDF file from IdUFF for a selected curriculum row
 */
export async function downloadIdUFFMatrixPdf(
  courseOptionValue: string,
  rowIndex: number,
  sessionInfo?: { sessionCookie: string; viewState: string; postUrl: string }
): Promise<ArrayBuffer> {
  let session = sessionInfo;
  if (!session) {
    const result = await fetchIdUFFCurricula(courseOptionValue);
    session = {
      sessionCookie: result.sessionCookie,
      viewState: result.viewState,
      postUrl: result.postUrl,
    };
  }

  const downloadParams = new URLSearchParams();
  downloadParams.append('visualizarCurriculos', 'visualizarCurriculos');
  downloadParams.append('visualizarCurriculos:cboCursos', courseOptionValue);
  downloadParams.append(
    `visualizarCurriculos:tabelaCurriculos:${rowIndex}:btnGerenciarCurriculo2`,
    'Baixar Currículo'
  );
  downloadParams.append('javax.faces.ViewState', session.viewState);

  const dlRes = await fetch(session.postUrl, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': session.sessionCookie,
      'Referer': IDUFF_URL,
    },
    body: downloadParams.toString(),
  });

  if (!dlRes.ok) {
    throw new Error(`Erro ao baixar PDF da matriz no IdUFF (${dlRes.status} ${dlRes.statusText})`);
  }

  const buffer = await dlRes.arrayBuffer();

  // Validate that response is indeed a PDF
  const header = Buffer.from(buffer.slice(0, 5)).toString('utf-8');
  if (!header.startsWith('%PDF')) {
    throw new Error('O IdUFF não retornou um arquivo PDF válido. Tente novamente em instantes.');
  }

  return buffer;
}

/**
 * Finds matching IdUFF course option given a course name from a student transcript
 */
export function findCourseByTranscript(
  courseName: string,
  courses: IdUFFCourseItem[]
): IdUFFCourseItem | undefined {
  if (!courseName) return undefined;

  const cleanInput = courseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  // 1. Exact or startsWith match
  const exact = courses.find(c => {
    const cleanLabel = c.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return cleanLabel.includes(cleanInput);
  });
  if (exact) return exact;

  // 2. Token match (e.g. "ENGENHARIA" and "ELETRICA")
  const inputTokens = cleanInput.split(/\s+/).filter(t => t.length > 2);
  const bestMatch = courses.find(c => {
    const cleanLabel = c.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return inputTokens.every(tok => cleanLabel.includes(tok));
  });

  return bestMatch;
}

/**
 * Automatically fetches the matching official matrix PDF for a course and optional curriculum version
 */
export async function autoFetchMatrixForTranscript(
  courseName: string,
  targetCurriculumCode?: string
): Promise<{ pdfBuffer: ArrayBuffer; courseMatched: IdUFFCourseItem; curriculumMatched?: IdUFFCurriculumItem }> {
  const courses = await fetchIdUFFCourses();
  const matchedCourse = findCourseByTranscript(courseName, courses);

  if (!matchedCourse) {
    throw new Error(`Não foi possível localizar o curso "${courseName}" no IdUFF.`);
  }

  const { sessionCookie, viewState, postUrl, curricula } = await fetchIdUFFCurricula(matchedCourse.value);

  if (curricula.length === 0) {
    throw new Error(`Nenhum currículo encontrado para o curso "${matchedCourse.label}" no IdUFF.`);
  }

  // Find matching curriculum code if provided, otherwise pick the latest (last row)
  let targetRowIndex = curricula.length - 1;
  let matchedCurr: IdUFFCurriculumItem | undefined = curricula[targetRowIndex];

  if (targetCurriculumCode) {
    const cleanCode = targetCurriculumCode.trim();
    const foundIndex = curricula.findIndex(c => c.curriculumCode.includes(cleanCode) || cleanCode.includes(c.curriculumCode));
    if (foundIndex >= 0) {
      targetRowIndex = foundIndex;
      matchedCurr = curricula[foundIndex];
    }
  }

  const pdfBuffer = await downloadIdUFFMatrixPdf(matchedCourse.value, targetRowIndex, {
    sessionCookie,
    viewState,
    postUrl,
  });

  return {
    pdfBuffer,
    courseMatched: matchedCourse,
    curriculumMatched: matchedCurr,
  };
}
