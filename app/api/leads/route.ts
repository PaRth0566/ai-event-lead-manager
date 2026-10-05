import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead, getLeadStats, getUniqueEvents, getDatabaseStatus } from '@/lib/db/leads';
import { leadSchema } from '@/lib/validations/lead';
import { FollowUpStatus } from '@/types/lead';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status') || undefined;
    const event = searchParams.get('event') || undefined;

    const status = statusParam && ['pending', 'contacted', 'completed', 'all'].includes(statusParam)
      ? (statusParam as FollowUpStatus | 'all')
      : undefined;

    const [leads, stats, events] = await Promise.all([
      getLeads({ search, status, event }),
      getLeadStats(),
      getUniqueEvents(),
    ]);

    const dbStatus = getDatabaseStatus();

    return NextResponse.json({
      success: true,
      data: {
        leads,
        stats,
        events,
        dbStatus,
      },
    });
  } catch (error) {
    console.error('API GET /api/leads error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to retrieve leads at this time. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = leadSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMap = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed. Please correct the highlighted errors.',
          details: errorMap,
        },
        { status: 400 }
      );
    }

    const newLead = await createLead(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created successfully',
        data: newLead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API POST /api/leads error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to save lead. Please check database configuration and try again.',
      },
      { status: 500 }
    );
  }
}
