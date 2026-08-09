import type { Request } from 'express';
import type { AuthenticatedAdmin } from '../../auth/types/authenticated-admin';

export type AuditRequestContext = {
  actorType: 'admin';
  actorId?: string;
  actorUsername?: string;
  actorDisplayName?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

export function getAuditContextFromRequest(
  request: Request,
): AuditRequestContext {
  const username = getAuthenticatedAdmin(request)?.username;

  return {
    actorType: 'admin',
    actorId: username,
    actorUsername: username,
    ipAddress: getConservativeIpAddress(request),
    userAgent: getSingleHeaderValue(request.headers['user-agent']),
    requestId: getSingleHeaderValue(request.headers['x-request-id']),
  };
}

function getAuthenticatedAdmin(request: Request) {
  const user = request.user;

  if (
    typeof user === 'object' &&
    user !== null &&
    'username' in user &&
    typeof user.username === 'string'
  ) {
    return user as AuthenticatedAdmin;
  }

  return undefined;
}

export function getUnauthenticatedAuditContextFromRequest(
  request: Request,
  username?: string,
): AuditRequestContext {
  const normalizedUsername = username?.trim() || undefined;

  return {
    actorType: 'admin',
    actorId: normalizedUsername,
    actorUsername: normalizedUsername,
    ipAddress: getConservativeIpAddress(request),
    userAgent: getSingleHeaderValue(request.headers['user-agent']),
    requestId: getSingleHeaderValue(request.headers['x-request-id']),
  };
}

function getConservativeIpAddress(request: Request) {
  return request.ip || request.socket.remoteAddress || undefined;
}

function getSingleHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
