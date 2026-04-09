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
    const history = await bomService.getDocumentHistory(id);
    return NextResponse.json({
      auditLogs: history.auditLogs.map((log) => ({
        id: log.id,
        documentId: log.documentId,
        versionId: log.versionId,
        action: log.action,
        userId: log.userId,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
      approvals: history.approvals.map((item) => ({
        id: item.id,
        documentId: item.documentId,
        versionId: item.versionId,
        action: item.action,
        actorId: item.actorId,
        actorRole: item.actorRole,
        comment: item.comment,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit log';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
