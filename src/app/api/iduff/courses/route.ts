import { NextResponse } from 'next/server';
import { fetchIdUFFCourses } from '@/lib/scraper/iduff-matrix-service';

export async function GET() {
  try {
    const courses = await fetchIdUFFCourses();
    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
