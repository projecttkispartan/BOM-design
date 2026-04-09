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
    const format = body.format || 'both';
    const exported = await bomService.exportBom(id, format, actor);
    return NextResponse.json(exported);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export BOM';
    const status = message.includes('only allowed for final') || message.includes('Invalid export format') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
