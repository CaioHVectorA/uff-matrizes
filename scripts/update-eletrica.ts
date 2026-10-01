import { parseMatrixText } from '../src/lib/parser/matrix-parser';
import { SAMPLE_MATRIX_TEXT } from '../src/lib/data/sample-data';
import * as fs from 'fs';

const matrix = parseMatrixText(SAMPLE_MATRIX_TEXT);
fs.writeFileSync('src/data/matrices/engenharia-eletrica.json', JSON.stringify(matrix, null, 2));
fs.writeFileSync('public/data/matrices/engenharia-eletrica.json', JSON.stringify(matrix, null, 2));
console.log('Saved', matrix.subjects.length, 'subjects for Engenharia Elétrica');
