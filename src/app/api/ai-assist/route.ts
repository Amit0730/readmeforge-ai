// ============================================================
// API Route — AI Assistant
// ============================================================

import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, currentReadme, projectContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required.' },
        { status: 400 }
      );
    }

    // If no AI API key configured, provide a helpful fallback
    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'AI assistance is not configured. To enable AI features, add a GEMINI_API_KEY to your environment variables. You can still use all other features: Markdown editing, templates, repository analysis, quality checks, and export.',
          updatedReadme: undefined,
        },
      });
    }

    // Call Gemini API
    const systemPrompt = `You are a README documentation assistant for the ReadmeForge AI tool. Your job is to help users improve their GitHub README files.

CRITICAL RULES:
- Only suggest changes based on the actual project information provided.
- NEVER invent technologies, features, commands, APIs, or deployment details not supported by the project context.
- If information is missing, tell the user what information you'd need.
- Keep your responses focused and actionable.
- When providing an updated README, output the full markdown content.

PROJECT CONTEXT:
${projectContext}

CURRENT README:
${currentReadme}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nUser request: ' + message }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({
        success: true,
        data: {
          message: 'AI request failed. Please check your API key configuration.',
          updatedReadme: undefined,
        },
      });
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    // Check if the response contains a full README update
    const readmeMatch = aiText.match(/```markdown\n([\s\S]*?)```/);
    const updatedReadme = readmeMatch ? readmeMatch[1].trim() : undefined;

    return NextResponse.json({
      success: true,
      data: {
        message: updatedReadme ? aiText.replace(/```markdown\n[\s\S]*?```/, '').trim() || 'Here is the updated README:' : aiText,
        updatedReadme,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI assistant error.';
    console.error('AI Assistant error:', message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
