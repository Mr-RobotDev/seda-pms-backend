import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, ProjectionType } from 'mongoose';
import { filter, map, Observable, Subject } from 'rxjs';
import { createObjectCsvWriter } from 'csv-writer';
import { format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';
import { Event } from './schema/event.schema';
import { Device } from '../device/schema/device.schema';
import { User } from '../user/schema/user.schema';
import { MediaService } from '../media/media.service';
import { DeviceService } from '../device/device.service';
import { UserService } from '../user/user.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetEventsQueryDto } from './dto/get-events.dto';
import { Folder } from '../common/enums/folder.enum';
import { DeviceType } from '../device/enums/device-type.enum';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { PartialUser } from '../user/types/partial-user.type';

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

  getChangeStream(device?: string): Observable<any> {
    return this.changeStreamSubject.asObservable().pipe(
      filter((change) => !device || change.fullDocument.device === device),
      map((change) => ({
        device: change.fullDocument.device,
        temperature: change.fullDocument.temperature,
        relativeHumidity: change.fullDocument.relativeHumidity,
        createdAt: change.fullDocument.createdAt,
        id: change.fullDocument._id,
      })),
    );
  }

  createEvent(createEventDto: CreateEventDto): Promise<Event> {
    return this.eventModel.create(createEventDto);
  }

  async getEvents(device: string, query: GetEventsQueryDto): Promise<Event[]> {
    const { from, to, eventTypes } = query;
    const adjustedTo = new Date(to);
    adjustedTo.setHours(23, 59, 59, 999);

    const filter: FilterQuery<Event> = {
      device,
      createdAt: { $gte: from, $lte: adjustedTo },
    };

    const projection: ProjectionType<Event> = {
      createdAt: 1,
    };
    if (eventTypes) {
      const eventTypesArray = eventTypes.split(',');
      eventTypesArray.forEach((type) => {
        projection[type] = 1;
      });
    } else {
      projection.temperature = 1;
      projection.relativeHumidity = 1;
      projection.pressure = 1;
    }

    return this.eventModel.find(filter, projection).sort({ createdAt: -1 });
  }

  async getFilePath(
    events: Event[],
    device: Device,
    from: Date,
    to: Date,
    user?: Partial<User>,
  ): Promise<string> {
    const exportsDirectory = path.join(__dirname, '../../../exports');
    if (!fs.existsSync(exportsDirectory)) {
      fs.mkdirSync(exportsDirectory, { recursive: true });
    }

    const formattedFrom = format(new Date(from), 'MMMM d, yyyy');
    const formattedTo = format(new Date(to), 'MMMM d, yyyy');
    const currentTime = format(new Date(), 'HH:mm:ss');

    const filePath = path.join(
      exportsDirectory,
      `Events - ${device.name} (${formattedFrom} - ${formattedTo}) - ${currentTime}.csv`,
    );

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'Event ID' },
        { id: 'deviceName', title: 'Device Name' },
        { id: 'deviceType', title: 'Device Type' },
        ...(device.type !== DeviceType.PRESSURE
          ? [
              { id: 'temperature', title: 'Temperature (°C)' },
              { id: 'relativeHumidity', title: 'Relative Humidity (%)' },
            ]
          : []),
        ...(device.type === DeviceType.PRESSURE
          ? [{ id: 'pressure', title: 'Pressure (Pa)' }]
          : []),
        { id: 'timestamp', title: 'Timestamp' },
        ...(user ? [{ id: 'exportedBy', title: 'Exported By' }] : []),
      ],
    });

    const records = events.map((event) => ({
      id: event.id,
      deviceName: device.name,
      deviceType:
        device.type !== DeviceType.PRESSURE
          ? 'Humidity/Temperature'
          : 'Pressure',
      ...(device.type !== DeviceType.PRESSURE
        ? {
            temperature: event.temperature,
            relativeHumidity: event.relativeHumidity,
          }
        : {}),
      ...(device.type === DeviceType.PRESSURE && {
        pressure: event.pressure,
      }),
      timestamp: event.createdAt,
      ...(user && {
        exportedBy: `${user.firstName} ${user.lastName}`,
      }),
    }));
    await csvWriter.writeRecords(records);

    return filePath;
  }

  async exportEvents(
    deviceId: string,
    query: GetEventsQueryDto,
    user?: string,
  ) {
    const { from, to } = query;
    const events = await this.getEvents(deviceId, query);
    console.log(events[0]);
    const device = await this.deviceService.getDeviceById(deviceId);
    let result: PartialUser;
    if (user) {
      result = await this.userService.getUserById(user);
    }

    const filePath = await this.getFilePath(
      events,
      device,
      from,
      to,
      result.user,
    );

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const url = await this.mediaService.uploadFile(
      fileBuffer,
      fileName,
      Folder.EXPORTS,
    );
    fs.unlinkSync(filePath);
    return { url };
  }
}
