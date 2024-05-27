import { Controller, Get, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { GetUserLogsQueryDto } from './dto/get-user-logs.dto';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller({
  path: 'logs',
  version: '1',
})
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Roles(Role.ADMIN)
  @Get()
  async getUserLogs(@Query() query: GetUserLogsQueryDto) {
    return this.logService.getUserLogs(query);
  }
}
