import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead, deleteLead } from '@/lib/db/leads';
import { leadUpdateSchema } from '@/lib/validations/lead';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or may have been deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('API GET /api/leads/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to retrieve lead details at this time' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const parseResult = leadUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed on updated fields',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await updateLead(id, parseResult.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or could not be updated' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('API PATCH /api/leads/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const success = await deleteLead(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    console.error('API DELETE /api/leads/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead. Please try again.' },
      { status: 500 }
    );
  }
}
