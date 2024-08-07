import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EventService } from '../event/event.service';
import { DeviceService } from '../device/device.service';
import { EventType } from '../event/enums/event-type.enum';
import { PressureDeviceSlug } from '../device/enums/pressure-device-slug.enum';

@Injectable()
export class WebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventService: EventService,
    private readonly deviceService: DeviceService,
  ) {}

  async receiveEvents(payload: any, signature: string): Promise<void> {
    if (!this.verifyRequest(JSON.stringify(payload), signature)) {
      throw new BadRequestException();
    }

    const eventType: EventType = payload.event.eventType;

    switch (eventType) {
      case EventType.HUMIDITY:
        await this.handleHumidityEvent(payload);
        break;
      case EventType.NETWORK_STATUS:
        await this.handleNetworkStatusEvent(payload);
        break;
      case EventType.CONNECTION_STATUS:
        await this.handleConnectionStatusEvent(payload);
        break;
      default:
        break;
    }
  }

  private verifyRequest(payload: string, signature: string): boolean {
    let decoded: any;
    try {
      decoded = jwt.verify(
        signature,
        this.configService.get('dataConnectorSecret'),
        {
          algorithms: ['HS256'],
        },
      );
    } catch (err) {
      return false;
    }

    const hash = crypto.createHash('sha256');
    const checksum = hash.update(payload).digest('hex');
    if (checksum !== decoded.checksum_sha256) {
      return false;
    }
    return true;
  }

  private async handleHumidityEvent(payload: any): Promise<void> {
    const oem: string = payload.metadata.deviceId;
    const temperature: number = payload.event.data.humidity.temperature;
    const relativeHumidity: number =
      payload.event.data.humidity.relativeHumidity;
    const lastUpdated: Date = payload.event.data.humidity.updateTime;

    const device = await this.deviceService.updateDeviceByOem(oem, {
      temperature,
      relativeHumidity,
      lastUpdated,
    });

    await this.eventService.createEvent({
      device: device.id,
      temperature,
      relativeHumidity,
    });
  }

  private async handleNetworkStatusEvent(payload: any): Promise<void> {
    const oem: string = payload.metadata.deviceId;
    const signalStrength: number =
      payload.event.data.networkStatus.signalStrength;

    await this.deviceService.updateDeviceByOem(oem, {
      signalStrength,
    });
  }

  private async handleConnectionStatusEvent(payload: any): Promise<void> {
    const oem: string = payload.metadata.deviceId;
    const isOffline: boolean =
      payload.event.data.connectionStatus.connection === 'OFFLINE'
        ? true
        : false;

    await this.deviceService.updateDeviceByOem(oem, {
      isOffline,
    });
  }

  async receivePressureEvents(
    rawBody: Buffer,
    pressureDeviceSlug: PressureDeviceSlug,
  ): Promise<void> {
    const pressure = Number(rawBody.toString('utf8'));

    const now = new Date();
    const device = await this.deviceService.updateDeviceBySlug(
      pressureDeviceSlug,
      pressure,
      now,
    );
    await this.eventService.createEvent({
      device: device.id,
      pressure,
    });
  }
}
