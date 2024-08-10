import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { AlertLogService } from './alert-log.service';
import { UpdateAlertLogDto } from './dto/update-alert-log.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Account } from '../common/interfaces/account.interface';
import { IsObjectIdPipe } from '../common/pipes/objectid.pipe';

@Controller({
  path: 'alert-logs',
  version: '1',
})
export class AlertLogController {
  constructor(private readonly alertLogService: AlertLogService) {}

  @Get()
  getAlertLogs(@Query() paginationDto: PaginationQueryDto) {
    return this.alertLogService.getAlertLogs(paginationDto);
  }

  @Patch(':alert-log')
  updateAlertLog(
    @Param('alert-log', IsObjectIdPipe) alertLog: string,
    @Body() updateAlertLogDto: UpdateAlertLogDto,
  ) {
    return this.alertLogService.updateAlertLog(alertLog, updateAlertLogDto);
  }

  @Patch(':alert-log/accept')
  acceptAlertLog(
    @CurrentUser() account: Account,
    @Param('alert-log', IsObjectIdPipe) alertLog: string,
  ) {
    return this.alertLogService.acceptAlertLog(account.sub, alertLog);
  }
}
