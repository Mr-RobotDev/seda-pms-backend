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
import { Public } from '../common/decorators/public.decorator';

@Controller({
  path: 'events',
  version: '1',
})
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Public()
  @Sse('sse')
  events(@Query('oem') oem?: string): Observable<any> {
    return this.eventService
      .getChangeStream(oem)
      .pipe(map((change) => ({ data: change })));
  }

  @Get()
  async getEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('oem') oem?: string,
  ) {
    return this.eventService.getEvents(page, limit, from, to, oem);
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
}
