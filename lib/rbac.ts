import type { NextRequest } from 'next/server';
import db from '@/lib/db';

export type UserRole = 'owner' | 'supervisor' | 'engineering' | 'ppic' | 'procurement';

export interface RequestActor {
  id: string;
  role: UserRole;
  email?: string;
}

const VALID_ROLES: UserRole[] = ['owner', 'supervisor', 'engineering', 'ppic', 'procurement'];

function normalizeRole(role: string | null | undefined): UserRole {
  const candidate = String(role || '').trim().toLowerCase();
  if (VALID_ROLES.includes(candidate as UserRole)) return candidate as UserRole;
  const fromEnv = String(process.env.DEFAULT_USER_ROLE || 'engineering').trim().toLowerCase();
  if (VALID_ROLES.includes(fromEnv as UserRole)) return fromEnv as UserRole;
  return 'engineering';
}

export async function getRequestActor(request: NextRequest): Promise<RequestActor> {
  const headerUserId = request.headers.get('x-user-id') || request.headers.get('x-user-email') || 'system';
  const headerRole = normalizeRole(request.headers.get('x-user-role'));
  const actor: RequestActor = { id: headerUserId, role: headerRole };

  try {
    const dbAny = db as any;
    if (!dbAny.user || !headerUserId || headerUserId === 'system') return actor;

    const byId = await dbAny.user.findUnique({ where: { id: headerUserId } });
    if (byId?.role && VALID_ROLES.includes(byId.role)) {
      return { id: byId.id, role: byId.role as UserRole, email: byId.email ?? undefined };
    }

    if (headerUserId.includes('@')) {
      const byEmail = await dbAny.user.findUnique({ where: { email: headerUserId } });
      if (byEmail?.role && VALID_ROLES.includes(byEmail.role)) {
        return { id: byEmail.id, role: byEmail.role as UserRole, email: byEmail.email ?? undefined };
      }
    }
  } catch {
    // Keep header/env fallback when user table is unavailable.
  }

  return actor;
}

export function hasAnyRole(actor: RequestActor, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(actor.role);
}

export function assertAnyRole(actor: RequestActor, allowedRoles: UserRole[]): void {
  if (!hasAnyRole(actor, allowedRoles)) {
    const allowed = allowedRoles.join(', ');
    throw new Error(`Forbidden: role ${actor.role} is not allowed. Allowed roles: ${allowed}`);
  }
}

