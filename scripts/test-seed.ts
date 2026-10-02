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

async function testSampleSeed() {
  const courses = await fetchIdUFFCourses();
  console.log(`Loaded ${courses.length} courses. Testing first 2 courses...`);

  const sampleCourses = courses.slice(0, 2);
  for (const c of sampleCourses) {
    console.log(`Fetching curricula for ${c.label}...`);
    const { curricula } = await fetchIdUFFCurricula(c.value);
    console.log(`Found ${curricula.length} curricula for ${c.label}`);

    for (const curr of curricula) {
      console.log(`Downloading curriculum ${curr.curriculumCode}...`);
      const pdfBuffer = await downloadIdUFFMatrixPdf(c.value, curr.rowIndex);
      const text = await extractPdfText(pdfBuffer);
      const matrixData = parseMatrixText(text);

      const filename = `${slugify(c.label)}-${slugify(curr.curriculumCode)}.json`;
      const outPath = path.join(process.cwd(), 'public', 'data', 'matrices', filename);
      await fs.writeFile(outPath, JSON.stringify(matrixData, null, 2), 'utf-8');
      console.log(`Saved ${filename} with ${matrixData.subjects.length} subjects!`);
    }
  }
}

testSampleSeed().catch(console.error);
