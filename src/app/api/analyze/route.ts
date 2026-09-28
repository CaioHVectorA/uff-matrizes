import { NextRequest, NextResponse } from 'next/server';
import { parseTranscriptText } from '@/lib/parser/transcript-parser';
import { analyzeStudentProgress } from '@/lib/analytics/matrix-analyzer';
import { BUILTIN_UFF_MATRICES } from '@/lib/scraper/builtin-matrices';
import { parseUFFMatrixHTML, MatrixRawData } from '@/lib/scraper/uff-scraper';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const textContent = formData.get('text') as string | null;
    const file = formData.get('file') as File | null;
    const selectedCourse = (formData.get('course') as string | null) || 'ciencia-da-computacao';
    const rawMatrixJson = formData.get('customMatrix') as string | null;

    let extractedText = textContent || '';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          // Dynamic import of pdf-parse to handle server-side PDF parsing
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || '';
        } catch (pdfErr) {
          console.warn('PDF parsing error fallback to raw text:', pdfErr);
          extractedText = buffer.toString('utf-8');
        }
      } else {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Envie um arquivo PDF do Histórico Escolar UFF ou cole o texto do histórico.' },
        { status: 400 }
      );
    }

    // Parse Transcript
    const transcriptData = parseTranscriptText(extractedText);

    // Get Target Course Matrix
    let targetMatrix: MatrixRawData = BUILTIN_UFF_MATRICES[selectedCourse] || BUILTIN_UFF_MATRICES['ciencia-da-computacao'];

    if (rawMatrixJson) {
      try {
        const customObj = JSON.parse(rawMatrixJson);
        if (customObj.subjects && Array.isArray(customObj.subjects)) {
          targetMatrix = customObj;
        } else if (typeof rawMatrixJson === 'string') {
          targetMatrix = parseUFFMatrixHTML(rawMatrixJson);
        }
      } catch (e) {
        console.warn('Failed to parse custom matrix JSON, using fallback builtin:', e);
      }
    }

    // Compute progress analysis
    const analysis = analyzeStudentProgress(targetMatrix, transcriptData);

    return NextResponse.json({
      success: true,
      transcript: transcriptData,
      matrix: targetMatrix,
      analysis,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Erro ao analisar histórico: ${errorMessage}` },
      { status: 500 }
    );
  }
}
