import { NextRequest, NextResponse } from 'next/server';
import { draftFollowUp } from '@/lib/ai/followup';
import { aiFollowUpSchema } from '@/lib/validations/lead';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = aiFollowUpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required lead details to draft a follow-up message.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await draftFollowUp(parseResult.data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('API /api/ai/followup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't generate the follow-up draft right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
