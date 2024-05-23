import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EventService } from '../event/event.service';
import { DeviceService } from '../device/device.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventService: EventService,
    private readonly deviceService: DeviceService,
  ) {}

  async receiveEvents(payload: any, signature: string) {
    if (!this.verifyRequest(JSON.stringify(payload), signature)) {
      throw new BadRequestException();
    }

    const deviceId = payload.metadata.deviceId;
    const temperature = payload.event.data.humidity.temperature;
    const relativeHumidity = payload.event.data.humidity.relativeHumidity;
    const updateTime = payload.event.data.humidity.updateTime;
    const eventType = payload.event.eventType;

    await Promise.all([
      this.eventService.createEvent(
        deviceId,
        eventType,
        temperature,
        relativeHumidity,
        updateTime,
      ),
      this.deviceService.updateDeviceByOem(
        deviceId,
        temperature,
        relativeHumidity,
        updateTime,
      ),
    ]);
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
}
