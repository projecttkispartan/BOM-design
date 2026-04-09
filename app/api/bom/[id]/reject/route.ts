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
    if (!body.comment || !String(body.comment).trim()) {
      return NextResponse.json({ error: 'comment is required' }, { status: 400 });
    }
    const version = await bomService.reject(id, actor, body.comment);
    return NextResponse.json(version);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject BOM';
    const status = message.startsWith('Forbidden') ? 403 : message.includes('required') || message.includes('Only submitted') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
