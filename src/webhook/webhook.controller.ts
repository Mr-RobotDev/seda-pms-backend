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
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g07')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG07(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g08')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG08(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g23')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG23(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g26')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG26(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g28')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG28(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g41')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG41(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g37')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG37(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }

  @Post('receive-pressure-events-g33')
  @HttpCode(HttpStatus.OK)
  receivePressureEventsG33(@Req() req: RawBodyRequest<Request>) {
    const rawBodyBuffer = req.rawBody;
    const rawBodyString = rawBodyBuffer.toString('utf8');
    console.log('Pressure events received', rawBodyString);
  }
}
