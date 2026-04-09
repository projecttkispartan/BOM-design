import { NextRequest, NextResponse } from 'next/server';
import * as bomService from '@/lib/bomService';

interface RouteContext {
  params: Promise<{
    versionId: string;
  }>;
}

const VALID_STATUSES = ['draft', 'submitted', 'approved', 'final', 'archived'] as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { versionId } = await context.params;
    const body = await request.json();
    const status = String(body.status || '').toLowerCase();
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }
    const updated = await bomService.updateVersionStatus(
      versionId,
      status as 'draft' | 'submitted' | 'approved' | 'final' | 'archived',
    );
    return NextResponse.json({
      versionId: updated.versionId,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status';
    const status = message.includes('Invalid') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
