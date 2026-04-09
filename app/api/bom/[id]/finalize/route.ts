import { NextRequest, NextResponse } from 'next/server';
import * as bomService from '@/lib/bomService';
import { getRequestActor } from '@/lib/rbac';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await getRequestActor(request);
    const body = await request.json().catch(() => ({}));
    const version = await bomService.finalize(id, actor, body.comment);
    return NextResponse.json(version);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to finalize BOM';
    const status = message.startsWith('Forbidden')
      ? 403
      : message.includes('Only approved') || message.includes('required') || message.includes('must be')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
