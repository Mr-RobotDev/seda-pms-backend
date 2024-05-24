import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { EventService } from './event.service';

@Controller({
  path: 'events',
  version: '1',
})
export class EventController {
  constructor(private readonly eventService: EventService) {}

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

  @Get('stream')
  getEventStream(@Res() res: Response, @Query('oem') oem?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    this.eventService.getEventStream(res, oem);
  }
}
