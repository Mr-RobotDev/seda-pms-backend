import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { Event } from './schema/event.schema';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: PaginatedModel<Event>,
  ) {}

  createEvent(
    oem: string,
    eventType: string,
    temperature: number,
    relativeHumidity: number,
    updateTime: Date,
  ) {
    return this.eventModel.create({
      oem,
      eventType,
      temperature,
      relativeHumidity,
      createdAt: updateTime,
      updatedAt: updateTime,
    });
  }

  async getEvents(
    page?: number,
    limit?: number,
    from?: string,
    to?: string,
    oem?: string,
  ): Promise<Result<Event>> {
    const defaultTo = moment().toISOString();
    const defaultFrom = moment().subtract(7, 'days').toISOString();
    const fromMoment = moment(from || defaultFrom);
    const toMoment = moment(to || defaultTo);

    return this.eventModel.paginate(
      {
        ...(oem && { oem }),
        createdAt: {
          $gte: fromMoment.toDate(),
          $lte: toMoment.toDate(),
        },
      },
      {
        page,
        limit,
      },
    );
  }
}
