import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { AlertLogService } from './alert-log.service';
import { GetAlertLogsDto } from './dto/get-alert-logs.dto';
import { UpdateAlertLogDto } from './dto/update-alert-log.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Account } from '../common/interfaces/account.interface';
import { IsObjectIdPipe } from '../common/pipes/objectid.pipe';

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

  @Patch(':alertLog/accept')
  acceptAlertLog(
    @CurrentUser() account: Account,
    @Param('alertLog', IsObjectIdPipe) alertLog: string,
  ) {
    return this.alertLogService.acceptAlertLog(account.sub, alertLog);
  }
}
