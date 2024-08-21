import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { AlertLogService } from './alert-log.service';
import { GetAlertLogsDto } from './dto/get-alert-logs.dto';
import { UpdateAlertLogDto } from './dto/update-alert-log.dto';
import { IsObjectIdPipe } from '../common/pipes/objectid.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Account } from '../common/interfaces/account.interface';

@Controller({
  path: 'alertLogs',
  version: '1',
})
export class AlertLogController {
  constructor(private readonly alertLogService: AlertLogService) {}

  @Get()
  getAlertLogs(@Query() getAlertLogsDto?: GetAlertLogsDto) {
    return this.alertLogService.getAlertLogs(getAlertLogsDto);
  }

  @Patch(':alertLog')
  updateAlertLog(
    @Param('alertLog', IsObjectIdPipe) alertLog: string,
    @Body() updateAlertLogDto: UpdateAlertLogDto,
  ) {
    return this.alertLogService.updateAlertLog(alertLog, updateAlertLogDto);
  }

  @Roles(Role.ADMIN)
  @Patch(':alertLog/accept')
  async acceptAlertLog(
    @CurrentUser() account: Account,
    @Param('alertLog', IsObjectIdPipe) alertLog: string,
  ) {
    await this.alertLogService.acceptAlertLog(account.sub, alertLog);
  }
}
