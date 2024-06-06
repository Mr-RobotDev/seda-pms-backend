import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import { Public } from '../common/decorators/public.decorator';
import { PressureDeviceSlug } from '../device/enums/pressure-device-slug.enum';

@Public()
@Controller({
  path: 'webhook',
  version: '1',
})
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('receive-events')
  @HttpCode(HttpStatus.OK)
  receiveEvents(
    @Req() request: Request,
    @Headers('x-dt-signature') signature: string,
  ) {
    return this.webhookService.receiveEvents(request.body, signature);
  }

  @Post('receive-pressure-events-g05')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG05(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G05_GOODS_OUT_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g07')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG07(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G07_QUARANTINE_STORE_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g08')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG08(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G08_RELEASED_MATERIALS_STORE_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g23')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG23(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G23_SPRAY_DRYING_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g26')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG26(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G26_POWDER_BOOTH_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g28')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG28(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G28_NON_HP_CLEANROOM_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g41')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG41(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G41_HP3_HIGH_POTENCY_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g37')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG37(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G37_HP2_HIGH_POTENCY_PRESSURE,
    );
  }

  @Post('receive-pressure-events-g33')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG33(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.receivePressureEvents(
      req.rawBody,
      PressureDeviceSlug.G33_HP1_HIGH_POTENCY_PRESSURE,
    );
  }
}
