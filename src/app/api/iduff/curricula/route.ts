import { NextRequest, NextResponse } from 'next/server';
import { fetchIdUFFCurricula } from '@/lib/scraper/iduff-matrix-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course = searchParams.get('course');

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'O parâmetro "course" é obrigatório.' },
        { status: 400 }
      );
    }

    const { curricula } = await fetchIdUFFCurricula(course);

    return NextResponse.json({
      success: true,
      course,
      curricula,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
