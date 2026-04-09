import { NextRequest, NextResponse } from 'next/server';
import * as bomService from '@/lib/bomService';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const usage = await bomService.getUsedInWo(id);
    return NextResponse.json(usage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Work Order usage';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
