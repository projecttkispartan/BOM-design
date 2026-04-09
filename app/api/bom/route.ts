import { NextRequest, NextResponse } from 'next/server';
import * as bomService from '@/lib/bomService';
import { getRequestActor } from '@/lib/rbac';

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status =
    message.startsWith('Forbidden')
      ? 403
      : message.includes('required') ||
          message.includes('Invalid') ||
          message.includes('already exists') ||
          message.includes('must be')
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const filters = bomService.parseListFilters(request.nextUrl.searchParams);
    const documents = await bomService.getAllBomDocuments(filters);
    return NextResponse.json(documents);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getRequestActor(request);
    const body = await request.json();
    const created = await bomService.createBomDocument(
      {
        code: body.code,
        name: body.name,
        description: body.description,
        metadata: body.metadata,
        bomRows: body.bomRows,
        hardwareRows: body.hardwareRows,
        operations: body.operations,
        packingRows: body.packingRows,
        packingInfo: body.packingInfo,
        createdBy: actor.id,
      },
      actor,
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
