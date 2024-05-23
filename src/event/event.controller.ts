import { Controller, Get, Query } from '@nestjs/common';
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
}
