import { NextRequest, NextResponse } from 'next/server';
import * as bomService from '@/lib/bomService';
import { getRequestActor } from '@/lib/rbac';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status =
    message.startsWith('Forbidden')
      ? 403
      : message.includes('not found')
        ? 404
        : message.includes('required') || message.includes('Invalid') || message.includes('must be')
          ? 400
          : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const document = await bomService.getBomDocument(id);
    if (!document) return NextResponse.json({ error: 'BOM Document not found' }, { status: 404 });
    return NextResponse.json(document);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await getRequestActor(request);
    const body = await request.json();
    const version = await bomService.updateBomVersion(
      id,
      {
        metadata: body.metadata,
        bomRows: body.bomRows,
        hardwareRows: body.hardwareRows,
        operations: body.operations,
        packingRows: body.packingRows,
        packingInfo: body.packingInfo,
        notes: body.notes,
      },
      actor,
    );
    return NextResponse.json(version);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const usage = await bomService.getUsedInWo(id);
    const force = request.nextUrl.searchParams.get('force') === '1';
    if (usage.count > 0 && !force) {
      return NextResponse.json(
        { error: 'BOM is used in Work Order', usedInWo: usage.count, items: usage.items },
        { status: 409 },
      );
    }
    const deleted = await bomService.deleteBomDocument(id);
    return NextResponse.json(deleted);
  } catch (error) {
    return toErrorResponse(error);
  }
}
