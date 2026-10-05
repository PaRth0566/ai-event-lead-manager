import { NextRequest, NextResponse } from 'next/server';
import { summarizeNotes } from '@/lib/ai/summarize';
import { aiSummarizeSchema } from '@/lib/validations/lead';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = aiSummarizeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide valid interaction notes to summarize.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await summarizeNotes(parseResult.data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('API /api/ai/summarize error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't generate the AI summary right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
