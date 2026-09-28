import fs from 'fs';
import path from 'path';
import { parseUFFMatrixHTML, MatrixRawData } from '../src/lib/scraper/uff-scraper';

/**
 * Scraper & Matrix Generator Script
 * Transforms UFF matrix HTML sources or text tables into static JSON matrix files in src/data/matrices/
 */
export function generateMatrixFile(courseKey: string, htmlOrText: string): MatrixRawData {
  const parsed = parseUFFMatrixHTML(htmlOrText);
  const targetPath = path.join(process.cwd(), 'src', 'data', 'matrices', `${courseKey}.json`);

  // Ensure output directory exists
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log(`Saved static matrix for ${courseKey} -> ${targetPath}`);
  return parsed;
}

if (require.main === module) {
  console.log('UFF Matrix Scraper script initialized.');
}
