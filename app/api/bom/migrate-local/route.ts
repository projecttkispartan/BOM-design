import { NextRequest, NextResponse } from 'next/server';
import * as bomService from '@/lib/bomService';
import { getRequestActor } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const actor = await getRequestActor(request);
    const body = await request.json().catch(() => ({}));
    const result = await bomService.migrateLocalDocuments(
      {
        docs: body.docs,
        legacyState: body.legacyState,
      },
      actor,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to migrate local data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
