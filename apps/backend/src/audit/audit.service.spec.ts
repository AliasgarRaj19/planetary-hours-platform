import { Logger } from '@nestjs/common';
import { AuditService, sanitizeMetadata } from './audit.service';
import type { PrismaService } from '../database/prisma.service';

describe('AuditService', () => {
  let prisma: PrismaAuditMock;
  let service: AuditService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        create: jest
          .fn<(input: { data: Record<string, unknown> }) => Promise<unknown>>()
          .mockResolvedValue({}),
        findMany: jest
          .fn<(input?: unknown) => Promise<unknown[]>>()
          .mockResolvedValue([]),
        count: jest
          .fn<(input?: unknown) => Promise<number>>()
          .mockResolvedValue(0),
      },
    };
    service = new AuditService(prisma as unknown as PrismaService);
  });

  it('creates sanitized audit records with backend actor context', async () => {
    await service.record({
      action: 'planetary_hours.day_content_update',
      module: 'planetary_hours',
      resourceType: 'planetary_hour_day',
      resourceId: 2,
      description: 'Planetary hour content was updated.',
      context: {
        actorType: 'admin',
        actorId: 'admin@example.com',
        actorUsername: 'admin@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      },
      metadata: {
        dayOfWeek: 2,
        changedRows: 24,
        password: 'secret',
        authorization: 'Bearer secret',
      },
    });

    const createCall = prisma.auditLog.create.mock.calls[0]?.[0];

    expect(createCall?.data).toMatchObject({
      actorUsername: 'admin@example.com',
      action: 'planetary_hours.day_content_update',
      result: 'success',
      resourceId: '2',
      metadata: {
        dayOfWeek: 2,
        changedRows: 24,
      },
    });
  });

  it('logs audit infrastructure failures without throwing', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    prisma.auditLog.create.mockRejectedValue(new Error('database unavailable'));

    await expect(
      service.record({
        action: 'blog.article.publish',
        module: 'blog',
        resourceType: 'blog_article',
        resourceId: 1,
        description: 'Article was published.',
      }),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      'Audit log write failed for blog.article.publish',
      expect.any(String),
    );

    errorSpy.mockRestore();
  });

  it('queries newest-first audit logs with pagination and filters', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'log_1',
        createdAt: new Date('2026-08-09T00:00:00.000Z'),
        actorType: 'admin',
        actorId: 'admin@example.com',
        actorUsername: 'admin@example.com',
        actorDisplayName: null,
        actorRole: null,
        action: 'blog.article.update',
        module: 'blog',
        resourceType: 'blog_article',
        resourceId: '1',
        resourceDisplayName: 'Article',
        description: 'Article updated.',
        result: 'success',
        metadata: null,
        ipAddress: '127.0.0.1',
        userAgent: null,
        requestId: null,
      },
    ]);
    prisma.auditLog.count.mockResolvedValue(1);

    const response = await service.query({
      page: 2,
      pageSize: 10,
      module: 'blog',
      actor: 'admin',
      result: 'success',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      }),
    );
    expect(response.pagination).toEqual({
      page: 2,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('returns distinct sorted filter options without sensitive metadata', async () => {
    prisma.auditLog.findMany
      .mockResolvedValueOnce([
        { actorUsername: 'admin@example.com' },
        { actorUsername: 'editor@example.com' },
      ])
      .mockResolvedValueOnce([{ module: 'auth' }, { module: 'blog' }])
      .mockResolvedValueOnce([
        { action: 'auth.login.success', module: 'auth' },
        { action: 'blog.article.update', module: 'blog' },
      ])
      .mockResolvedValueOnce([
        { resourceType: 'admin_session' },
        { resourceType: 'blog_article' },
      ]);

    await expect(service.getFilterOptions()).resolves.toEqual({
      actors: ['admin@example.com', 'editor@example.com'],
      modules: ['auth', 'blog'],
      actions: [
        { value: 'auth.login.success', module: 'auth' },
        { value: 'blog.article.update', module: 'blog' },
      ],
      resourceTypes: ['admin_session', 'blog_article'],
    });
    expect(JSON.stringify(prisma.auditLog.findMany.mock.calls)).not.toContain(
      'metadata',
    );
    expect(JSON.stringify(prisma.auditLog.findMany.mock.calls)).not.toContain(
      'ipAddress',
    );
  });

  it('removes sensitive nested metadata keys', () => {
    expect(
      sanitizeMetadata({
        slug: 'example',
        nested: {
          cookie: 'hidden',
          changedFields: ['title'],
        },
        headers: {
          authorization: 'Bearer secret',
        },
      }),
    ).toEqual({
      slug: 'example',
      nested: {
        changedFields: ['title'],
      },
      headers: {},
    });
  });
});

type PrismaAuditMock = {
  auditLog: {
    create: jest.MockedFunction<
      (input: { data: Record<string, unknown> }) => Promise<unknown>
    >;
    findMany: jest.MockedFunction<(input?: unknown) => Promise<unknown[]>>;
    count: jest.MockedFunction<(input?: unknown) => Promise<number>>;
  };
};
