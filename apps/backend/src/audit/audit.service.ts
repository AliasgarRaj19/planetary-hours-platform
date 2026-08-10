import { Injectable, Logger } from '@nestjs/common';
import { AuditLogResult, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuditLogQueryDto } from './dto/audit-log-query.dto';
import type { AuditRequestContext } from './types/audit-context';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_STRING_LENGTH = 500;
const MAX_METADATA_DEPTH = 4;

const SENSITIVE_KEY_PATTERN =
  /(password|hash|token|authorization|cookie|credential|secret|private.?key|api.?key|database.?url|jwt|service.?account|body|content|message)/i;

export type AuditRecordInput = {
  action: string;
  module: string;
  resourceType: string;
  resourceId?: string | number | null;
  resourceDisplayName?: string | null;
  description: string;
  result?: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  context?: AuditRequestContext;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: input.context?.actorType ?? 'admin',
          actorId: input.context?.actorId,
          actorUsername: input.context?.actorUsername,
          actorDisplayName: input.context?.actorDisplayName,
          actorRole: input.context?.actorRole,
          action: input.action,
          module: input.module,
          resourceType: input.resourceType,
          resourceId:
            input.resourceId === null || input.resourceId === undefined
              ? undefined
              : String(input.resourceId),
          resourceDisplayName: input.resourceDisplayName ?? undefined,
          description: input.description,
          result:
            input.result === 'failure'
              ? AuditLogResult.failure
              : AuditLogResult.success,
          metadata: sanitizeMetadata(input.metadata),
          ipAddress: input.context?.ipAddress,
          userAgent: input.context?.userAgent,
          requestId: input.context?.requestId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Audit log write failed for ${input.action}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async query(query: AuditLogQueryDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = Math.min(
      query.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const where = buildAuditLogWhere(query);
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        actorType: item.actorType,
        actorId: item.actorId,
        actorUsername: item.actorUsername,
        actorDisplayName: item.actorDisplayName,
        actorRole: item.actorRole,
        action: item.action,
        module: item.module,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        resourceDisplayName: item.resourceDisplayName,
        description: item.description,
        result: item.result,
        metadata: item.metadata,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        requestId: item.requestId,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getFilterOptions() {
    const [actors, modules, actions, resourceTypes] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          actorUsername: { not: null },
        },
        distinct: ['actorUsername'],
        select: {
          actorUsername: true,
        },
        orderBy: {
          actorUsername: 'asc',
        },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['module'],
        select: {
          module: true,
        },
        orderBy: {
          module: 'asc',
        },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        select: {
          action: true,
          module: true,
        },
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      }),
      this.prisma.auditLog.findMany({
        distinct: ['resourceType'],
        select: {
          resourceType: true,
        },
        orderBy: {
          resourceType: 'asc',
        },
      }),
    ]);

    return {
      actors: actors
        .map((item) => item.actorUsername)
        .filter((actor): actor is string => Boolean(actor)),
      modules: modules.map((item) => item.module),
      actions: actions.map((item) => ({
        value: item.action,
        module: item.module,
      })),
      resourceTypes: resourceTypes.map((item) => item.resourceType),
    };
  }
}

function buildAuditLogWhere(
  query: AuditLogQueryDto,
): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];

  if (query.from || query.to) {
    and.push({
      createdAt: {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      },
    });
  }

  if (query.actor) {
    and.push({
      OR: [
        { actorUsername: { contains: query.actor, mode: 'insensitive' } },
        { actorId: { contains: query.actor, mode: 'insensitive' } },
      ],
    });
  }

  if (query.module) {
    and.push({ module: query.module });
  }

  if (query.action) {
    and.push({ action: query.action });
  }

  if (query.result) {
    and.push({ result: query.result });
  }

  if (query.resourceType) {
    and.push({ resourceType: query.resourceType });
  }

  if (query.resourceId) {
    and.push({ resourceId: query.resourceId });
  }

  if (query.search) {
    and.push({
      OR: [
        { description: { contains: query.search, mode: 'insensitive' } },
        { action: { contains: query.search, mode: 'insensitive' } },
        { module: { contains: query.search, mode: 'insensitive' } },
        {
          resourceDisplayName: { contains: query.search, mode: 'insensitive' },
        },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function sanitizeMetadata(
  input: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (!input) {
    return undefined;
  }

  return sanitizeMetadataValue(input, 0) as Prisma.InputJsonValue;
}

function sanitizeMetadataValue(value: unknown, depth: number): unknown {
  if (depth > MAX_METADATA_DEPTH) {
    return '[Max depth reached]';
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item, depth + 1));
  }

  if (typeof value === 'object' && value !== null) {
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        continue;
      }

      output[key] = sanitizeMetadataValue(nestedValue, depth + 1);
    }

    return output;
  }

  if (typeof value === 'bigint') {
    return value.toString().slice(0, MAX_STRING_LENGTH);
  }

  return null;
}
