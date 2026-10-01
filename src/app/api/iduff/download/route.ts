import { NextRequest, NextResponse } from 'next/server';
import {
  downloadIdUFFMatrixPdf,
  autoFetchMatrixForTranscript,
  fetchIdUFFCurricula
} from '@/lib/scraper/iduff-matrix-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { course, rowIndex, curriculumCode, autoMatchCourseName } = body;

    // 1. Auto-fetch mode (from student transcript course name)
    if (autoMatchCourseName) {
      const result = await autoFetchMatrixForTranscript(autoMatchCourseName, curriculumCode);
      return new NextResponse(result.pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Matriz-${result.courseMatched.value}.pdf"`,
          'X-Course-Matched': encodeURIComponent(result.courseMatched.label),
          'X-Curriculum-Matched': encodeURIComponent(result.curriculumMatched?.curriculumCode || ''),
        },
      });
    }

    // 2. Direct selection mode
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro "course" é obrigatório.' },
        { status: 400 }
      );
    }

    let targetRow = typeof rowIndex === 'number' ? rowIndex : 0;

    // If curriculumCode was provided instead of rowIndex
    if (curriculumCode && typeof rowIndex !== 'number') {
      const { curricula } = await fetchIdUFFCurricula(course);
      const foundIdx = curricula.findIndex(c => c.curriculumCode.includes(curriculumCode) || curriculumCode.includes(c.curriculumCode));
      if (foundIdx >= 0) targetRow = foundIdx;
    }

    const pdfBuffer = await downloadIdUFFMatrixPdf(course, targetRow);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="MatrizCurricular-IdUFF.pdf"',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
