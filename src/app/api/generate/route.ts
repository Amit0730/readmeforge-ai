// ============================================================
// API Route — README Generation
// ============================================================

import { NextResponse } from 'next/server';
import { generateReadme, generateBadges } from '@/lib/readme-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysis, manualInput, template = 'developer', screenshots = [] } = body;

    if (!analysis && !manualInput) {
      return NextResponse.json(
        { success: false, error: 'Either analysis data or manual input is required.' },
        { status: 400 }
      );
    }

    // Generate badges
    const repoUrl = analysis?.repo?.url || manualInput?.repoUrl || '';
    const license = analysis?.repo?.license || manualInput?.license || null;
    const technologies = analysis?.technologies || [];
    const badges = generateBadges(repoUrl, license, technologies);

    const result = generateReadme(
      analysis || null,
      manualInput || null,
      template,
      screenshots,
      badges
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        badges,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate README.';
    console.error('Generation error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
