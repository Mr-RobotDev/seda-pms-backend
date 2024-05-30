import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { filter, map, Observable, Subject } from 'rxjs';
import { createObjectCsvWriter } from 'csv-writer';
import { format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';
import { Event } from './schema/event.schema';
import { MediaService } from '../media/media.service';
import { DeviceService } from '../device/device.service';
import { UserService } from '../user/user.service';
import { GetEventsQueryDto } from './dto/get-events.dto';
import { Folder } from '../common/enums/folder.enum';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { FilterQuery, ProjectionType } from 'mongoose';

@Injectable()
export class EventService implements OnModuleInit {
  private changeStreamSubject = new Subject<any>();

  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: PaginatedModel<Event>,
    private readonly mediaService: MediaService,
    private readonly deviceService: DeviceService,
    private readonly userService: UserService,
  ) {}

  async onModuleInit() {
    const changeStream = this.eventModel.watch();
    changeStream.on('change', (change) => {
      this.changeStreamSubject.next(change);
    });
  }

  getChangeStream(oem?: string): Observable<any> {
    return this.changeStreamSubject.asObservable().pipe(
      filter((change) => !oem || change.fullDocument.oem === oem),
      map((change) => ({
        oem: change.fullDocument.oem,
        eventType: change.fullDocument.eventType,
        temperature: change.fullDocument.temperature,
        relativeHumidity: change.fullDocument.relativeHumidity,
        createdAt: change.fullDocument.createdAt,
        id: change.fullDocument._id,
      })),
    );
  }

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
    query: GetEventsQueryDto,
  ): Promise<{ results: Event[]; totalResults: number }> {
    const { oem, from, to, eventTypes } = query;
    const adjustedTo = new Date(to);
    adjustedTo.setHours(23, 59, 59, 999);

    const filter: FilterQuery<Event> = {
      ...(oem && { oem }),
      createdAt: { $gte: from, $lte: adjustedTo },
    };

    const projection: ProjectionType<Event> = {
      createdAt: 1,
      oem: 1,
      eventType: 1,
    };
    if (eventTypes) {
      const eventTypesArray = eventTypes.split(',');
      eventTypesArray.forEach((type) => {
        projection[type] = 1;
      });
    } else {
      projection.temperature = 1;
      projection.relativeHumidity = 1;
    }

    const events = await this.eventModel
      .find(filter, projection)
      .sort({ createdAt: -1 });

    return { results: events, totalResults: events.length };
  }

  async exportEvents(
    user: string,
    query: GetEventsQueryDto,
  ): Promise<{ url: string }> {
    const { from, to } = query;
    const events = await this.getEvents(query);
    const device = await this.deviceService.getDeviceByOem(query.oem);
    const result = await this.userService.getUserById(user);

    const exportsDirectory = path.join(__dirname, '../../../exports');
    if (!fs.existsSync(exportsDirectory)) {
      fs.mkdirSync(exportsDirectory, { recursive: true });
    }

    const formattedFrom = format(new Date(from), 'MMMM d, yyyy');
    const formattedTo = format(new Date(to), 'MMMM d, yyyy');

    const filePath = path.join(
      exportsDirectory,
      `Events (${formattedFrom} - ${formattedTo}).csv`,
    );

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'Event ID' },
        { id: 'oem', title: 'Device ID' },
        { id: 'deviceName', title: 'Device Name' },
        { id: 'deviceType', title: 'Device Type' },
        { id: 'temperature', title: 'Temperature (°C)' },
        { id: 'relativeHumidity', title: 'Relative Humidity (%)' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'exportedBy', title: 'Exported By' },
      ],
    });

    const records = events.results.map((event) => ({
      id: event.id,
      oem: event.oem,
      deviceName: device.name,
      deviceType:
        device.type === 'humidity' || device.type === 'cold'
          ? 'Humidity/Temperature'
          : 'Pressure',
      temperature: event.temperature,
      relativeHumidity: event.relativeHumidity,
      timestamp: event.createdAt,
      exportedBy: `${result.user.firstName} ${result.user.lastName}`,
    }));
    await csvWriter.writeRecords(records);

    const url = await this.mediaService.uploadCsv(filePath, Folder.EXPORTS);
    return { url };
  }
}
