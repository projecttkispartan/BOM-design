import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyOwnerSummary } from '@/lib/bomService';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.nextUrl.searchParams.get('secret');
  return token === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const force = request.nextUrl.searchParams.get('force') === '1';
    const result = await runWeeklyOwnerSummary({ force });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run weekly summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
