import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EventService } from '../event/event.service';
import { DeviceService } from '../device/device.service';
import { DeviceType } from '../device/enums/device-type.enum';

@Injectable()
export class WebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventService: EventService,
    private readonly deviceService: DeviceService,
  ) {}

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

  async receiveEvents(payload: any, signature: string): Promise<void> {
    if (!this.verifyRequest(JSON.stringify(payload), signature)) {
      throw new BadRequestException();
    }

    const eventType: DeviceType = payload.event.eventType;

    switch (eventType) {
      case DeviceType.HUMIDITY:
        await this.handleHumidityEvent(payload);
        break;
      case DeviceType.NETWORK_STATUS:
        await this.handleNetworkStatusEvent(payload);
        break;
      case DeviceType.CONNECTION_STATUS:
        await this.handleConnectionStatusEvent(payload);
        break;
      default:
        break;
    }
  }

  private async handleHumidityEvent(payload: any): Promise<void> {
    const oem: string = payload.metadata.deviceId;
    const temperature: number = payload.event.data.humidity.temperature;
    const relativeHumidity: number =
      payload.event.data.humidity.relativeHumidity;
    const lastUpdated: Date = payload.event.data.humidity.updateTime;

    await Promise.all([
      this.eventService.createEvent(
        oem,
        DeviceType.HUMIDITY,
        temperature,
        relativeHumidity,
        lastUpdated,
      ),
      this.deviceService.updateDeviceByOem(oem, {
        temperature,
        relativeHumidity,
        lastUpdated,
      }),
    ]);
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
      payload.event.data.connectionStatus.connection === 'OFFLINE';

    await this.deviceService.updateDeviceByOem(oem, {
      isOffline,
    });
  }
}
