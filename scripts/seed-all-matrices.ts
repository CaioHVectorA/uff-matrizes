import { fetchIdUFFCourses, fetchIdUFFCurricula, downloadIdUFFMatrixPdf } from '../src/lib/scraper/iduff-matrix-service';
import { parseMatrixText } from '../src/lib/parser/matrix-parser';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as fs from 'fs/promises';
import * as path from 'path';

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items.map((item: any) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
    }));

    items.sort((a: any, b: any) => Math.abs(b.y - a.y) > 3.5 ? b.y - a.y : a.x - b.x);

    const lines: string[] = [];
    let currentLine: any[] = [];
    let currentY: number | null = null;
    for (const item of items) {
      if (currentY === null || Math.abs(currentY - item.y) <= 3.5) {
        currentLine.push(item);
        if (currentY === null) currentY = item.y;
      } else {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine.map(i => i.str).join(' ').trim());
        currentLine = [item];
        currentY = item.y;
      }
    }
    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine.map(i => i.str).join(' ').trim());
    }
    fullText += lines.filter(l => l.length > 0).join('\n') + '\n\n';
  }
  return fullText;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface MatrixIndexEntry {
  id: string;
  courseLabel: string;
  courseValue: string;
  curriculumCode: string;
  turno: string;
  degree: string;
  qualification: string;
  emphasis: string;
  trainingLine: string;
  subjectsCount: number;
  totalHours: number;
  jsonFile: string;
  pdfFile: string;
  githubJsonUrl: string;
  githubPdfUrl: string;
}

const GITHUB_BASE = 'https://github.com/CaioHVectorA/uff-matrizes/blob/main';

async function seedAll() {
  const outDir = path.join(process.cwd(), 'public', 'data', 'matrices');
  const pdfDir = path.join(outDir, 'pdf');
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(pdfDir, { recursive: true });

  const courses = await fetchIdUFFCourses();
  console.log(`=== Iniciar Seed do IdUFF: ${courses.length} cursos encontrados ===`);

  const index: MatrixIndexEntry[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    console.log(`\n[${i + 1}/${courses.length}] Processando: ${c.label}...`);

    try {
      const { sessionCookie, viewState, postUrl, curricula } = await fetchIdUFFCurricula(c.value);
      if (curricula.length === 0) {
        console.warn(`  Nenhum currículo para ${c.label}`);
        continue;
      }

      console.log(`  Encontrados ${curricula.length} currículos`);

      // Process each curriculum for this course
      for (const curr of curricula) {
        const fileSlug = `${slugify(c.label)}-${slugify(curr.curriculumCode)}`;
        const jsonFilename = `${fileSlug}.json`;
        const pdfFilename = `${fileSlug}.pdf`;
        const jsonFilePath = path.join(outDir, jsonFilename);
        const pdfFilePath = path.join(pdfDir, pdfFilename);

        let matrixData: any;
        let pdfBuffer: ArrayBuffer | null = null;

        // Check if both JSON and PDF already exist
        let jsonExists = false;
        let pdfExists = false;
        try {
          await fs.access(jsonFilePath);
          jsonExists = true;
        } catch {
          jsonExists = false;
        }
        try {
          await fs.access(pdfFilePath);
          pdfExists = true;
        } catch {
          pdfExists = false;
        }

        if (jsonExists && pdfExists) {
          const raw = await fs.readFile(jsonFilePath, 'utf-8');
          matrixData = JSON.parse(raw);
          console.log(`  ✓ Já existente: ${curr.curriculumCode} (${matrixData.subjects?.length || 0} matérias)`);
        } else {
          try {
            pdfBuffer = await downloadIdUFFMatrixPdf(c.value, curr.rowIndex, {
              sessionCookie,
              viewState,
              postUrl,
            });

            // Save PDF binary
            await fs.writeFile(pdfFilePath, Buffer.from(pdfBuffer));

            // Parse matrix data
            const text = await extractPdfText(pdfBuffer);
            matrixData = parseMatrixText(text);

            // Enrich matrix data with course info if missing
            if (!matrixData.courseName) matrixData.courseName = c.label;
            if (!matrixData.curriculumCode) matrixData.curriculumCode = curr.curriculumCode;

            // Save JSON
            await fs.writeFile(jsonFilePath, JSON.stringify(matrixData, null, 2), 'utf-8');
            console.log(`  + Salvo: ${curr.curriculumCode} (${matrixData.subjects?.length || 0} matérias, PDF salvo)`);
          } catch (err: any) {
            console.error(`  x Falha no currículo ${curr.curriculumCode}:`, err.message);
            continue;
          }
        }

        index.push({
          id: fileSlug,
          courseLabel: c.label,
          courseValue: c.value,
          curriculumCode: curr.curriculumCode,
          turno: curr.turno,
          degree: curr.degree,
          qualification: curr.qualification,
          emphasis: curr.emphasis,
          trainingLine: curr.trainingLine,
          subjectsCount: matrixData?.subjects?.length || 0,
          totalHours: matrixData?.totalHours || 0,
          jsonFile: `/data/matrices/${jsonFilename}`,
          pdfFile: `/data/matrices/pdf/${pdfFilename}`,
          githubJsonUrl: `${GITHUB_BASE}/public/data/matrices/${jsonFilename}`,
          githubPdfUrl: `${GITHUB_BASE}/public/data/matrices/pdf/${pdfFilename}`,
        });

        successCount++;
      }
    } catch (err: any) {
      console.error(`  Erro geral ao consultar ${c.label}:`, err.message);
      failCount++;
    }

    // Delay slightly to be gentle on IdUFF server
    await new Promise(r => setTimeout(r, 200));
  }

  // Deduplicate and sort index by course label then curriculum
  index.sort((a, b) => a.courseLabel.localeCompare(b.courseLabel, 'pt-BR') || a.curriculumCode.localeCompare(b.curriculumCode));

  // Write index.json
  const indexPath = path.join(outDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');

  // Generate MATRIZES_CATALOG.md markdown file with direct links
  let catalogMd = `# Catálogo de Matrizes Curriculares - Universidade Federal Fluminense (UFF)\n\n`;
  catalogMd += `Este catálogo contém **${index.length} matrizes curriculares** de cursos de graduação da UFF extraídas diretamente do IdUFF.\n\n`;
  catalogMd += `Para cada curso, você pode visualizar o arquivo **JSON formatado** ou o arquivo **PDF oficial**.\n\n`;
  catalogMd += `| Curso | Currículo | Turno | Titulação | Matérias | Carga Horária | JSON | PDF |\n`;
  catalogMd += `| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |\n`;

  for (const item of index) {
    catalogMd += `| ${item.courseLabel} | \`${item.curriculumCode}\` | ${item.turno || '-'} | ${item.degree || '-'} | ${item.subjectsCount} | ${item.totalHours ? item.totalHours + 'h' : '-'} | [Ver JSON](${item.githubJsonUrl}) | [Ver PDF](${item.githubPdfUrl}) |\n`;
  }

  const catalogPath = path.join(process.cwd(), 'MATRIZES_CATALOG.md');
  await fs.writeFile(catalogPath, catalogMd, 'utf-8');

  console.log(`\n=== SEED CONCLUÍDO COM SUCESSO ===`);
  console.log(`Matrizes indexadas: ${index.length}`);
  console.log(`Cursos com sucesso: ${successCount}`);
  console.log(`Cursos com falha: ${failCount}`);
  console.log(`Índice gravado em: ${indexPath}`);
  console.log(`Catálogo Markdown gravado em: ${catalogPath}`);
}

seedAll().catch(console.error);
