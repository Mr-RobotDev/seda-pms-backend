import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import * as moment from 'moment';
import { Event } from './schema/event.schema';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: PaginatedModel<Event>,
  ) {}

  getEventStream(res: Response, oem?: string): void {
    const pipeline = [];

    if (oem) {
      pipeline.push({
        $match: { 'fullDocument.oem': oem },
      });
    }

    const changeStream = this.eventModel.watch(pipeline);

    changeStream.on('change', (change) => {
      if (change.operationType === 'insert' && change.fullDocument) {
        const formattedDocument = {
          oem: change.fullDocument.oem,
          eventType: change.fullDocument.eventType,
          temperature: change.fullDocument.temperature,
          relativeHumidity: change.fullDocument.relativeHumidity,
          createdAt: change.fullDocument.createdAt,
          id: change.fullDocument._id,
        };
        res.write(`data: ${JSON.stringify(formattedDocument)}\n\n`);
      }
    });

    changeStream.on('error', (error) => {
      console.error(error);
    });

    res.on('close', () => {
      changeStream.close();
      res.end();
    });
  }

  createEvent(
    oem: string,
    eventType: string,
    temperature: number,
    relativeHumidity: number,
    updateTime: Date,
  ): Promise<Event> {
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
