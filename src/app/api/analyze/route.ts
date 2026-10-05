// ============================================================
// API Route — GitHub Repository Analysis
// ============================================================

import { NextResponse } from 'next/server';
import { analyzeRepository } from '@/lib/github';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid GitHub repository URL.' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!url.includes('github.com') && !url.match(/^[^/]+\/[^/]+$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format. Please enter a GitHub repository URL (e.g., https://github.com/user/repo).' },
        { status: 400 }
      );
    }

    // Use server-side token if available
    const token = process.env.GITHUB_TOKEN;

    const analysis = await analyzeRepository(url, token);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    console.error('Analysis error:', message);

    return NextResponse.json(
      { success: false, error: message },
      { status: error instanceof Error && message.includes('rate limit') ? 429 : 500 }
    );
  }
}
