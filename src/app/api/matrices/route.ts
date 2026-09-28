import { NextRequest, NextResponse } from 'next/server';
import { BUILTIN_UFF_MATRICES } from '@/lib/scraper/builtin-matrices';
import { parseUFFMatrixHTML } from '@/lib/scraper/uff-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseKey = searchParams.get('course');

  if (courseKey && BUILTIN_UFF_MATRICES[courseKey]) {
    return NextResponse.json({
      success: true,
      source: 'builtin',
      matrix: BUILTIN_UFF_MATRICES[courseKey],
    });
  }

  // Return available matrix list
  const courses = Object.keys(BUILTIN_UFF_MATRICES).map(key => ({
    key,
    code: BUILTIN_UFF_MATRICES[key].courseCode,
    name: BUILTIN_UFF_MATRICES[key].courseName,
    matrixCode: BUILTIN_UFF_MATRICES[key].matrixCode,
    campus: BUILTIN_UFF_MATRICES[key].campus,
    totalHours: BUILTIN_UFF_MATRICES[key].totalHours,
  }));

  return NextResponse.json({
    success: true,
    courses,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { htmlContent, url } = body;

    let contentToParse = htmlContent;

    if (url) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        contentToParse = await response.text();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          { success: false, error: `Não foi possível acessar a URL informada: ${errorMessage}` },
          { status: 400 }
        );
      }
    }

    if (!contentToParse) {
      return NextResponse.json(
        { success: false, error: 'O HTML ou URL da matriz curricular deve ser fornecido.' },
        { status: 400 }
      );
    }

    const parsedMatrix = parseUFFMatrixHTML(contentToParse);

    return NextResponse.json({
      success: true,
      source: 'scraped',
      matrix: parsedMatrix,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Erro ao processar matriz: ${errorMessage}` },
      { status: 500 }
    );
  }
}
