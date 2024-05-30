import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  Sse,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  getEventStream(@Res() res: Response, @Query('oem') oem?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    this.eventService.getEventStream(res, oem);
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
