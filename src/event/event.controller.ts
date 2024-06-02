import { Controller, Get, Query, Sse } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { EventService } from './event.service';
import { GetEventsQueryDto } from './dto/get-events.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Account } from '../common/interfaces/account.interface';

@Controller({
  path: 'events',
  version: '1',
})
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Sse('sse')
  events(@Query('oem') oem?: string): Observable<any> {
    return this.eventService
      .getChangeStream(oem)
      .pipe(map((change) => ({ data: change })));
  }

  @Get()
  async getEvents(@Query() query: GetEventsQueryDto) {
    return this.eventService.getEvents(query);
  }

  @Get('export')
  async exportEvents(
    @CurrentUser() account: Account,
    @Query() query: GetEventsQueryDto,
  ) {
    return this.eventService.exportEvents(account.sub, query);
  }
}
