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
    const versions = document.versions.map((version) => ({
      id: version.id,
      versionId: version.versionId,
      version: version.version,
      status: version.status,
      isImmutable: version.isImmutable,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      createdBy: version.createdBy,
      notes: version.notes,
      parentVersionId: version.parentVersionId,
      isCurrent: version.id === document.currentVersionId,
    }));
    return NextResponse.json(versions);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await getRequestActor(request);
    const body = await request.json();
    const version = await bomService.createNewVersion(
      id,
      {
        version: body.version,
        status: body.status,
        notes: body.notes,
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
    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
