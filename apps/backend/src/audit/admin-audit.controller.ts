import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Controller('admin/audit-logs')
@UseGuards(AdminJwtGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('filter-options')
  getFilterOptions() {
    return this.auditService.getFilterOptions();
  }

  @Get()
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.query(query);
  }
}
