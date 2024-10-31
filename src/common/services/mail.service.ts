import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sendGrid from '@sendgrid/mail';
import { AttachmentData } from '../interfaces/attachment-data.interface';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {
    sendGrid.setApiKey(this.configService.get<string>('sendgrid.key'));
  }

  async sendForgotPasswordEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    try {
      const mail: sendGrid.MailDataRequired = {
        to,
        from: `Origin Smart Controls <${this.configService.get<string>('sendgrid.from')}>`,
        dynamicTemplateData: {
          name,
          url,
        },
        templateId: this.configService.get<string>(
          'sendgrid.forgotPasswordTemplate',
        ),
      };

      const transport = await sendGrid.send(mail);
      return transport[0].statusCode === HttpStatus.ACCEPTED;
    } catch {
      return false;
    }
  }

  async sendDashboardReport(
    emails: string[],
    attachments: AttachmentData[],
    dashboardName: string,
    timeframe: string,
  ): Promise<boolean> {
    try {
      const promises = emails.map((email) => {
        const mail: sendGrid.MailDataRequired = {
          to: email,
          from: `Origin Smart Controls <${this.configService.get<string>('sendgrid.from')}>`,
          dynamicTemplateData: {
            dashboardName,
            timeframe,
          },
          attachments,
          templateId: this.configService.get<string>(
            'sendgrid.dashboardReportTemplate',
          ),
        };
        return sendGrid.send(mail);
      });

      await Promise.all(promises);
    } catch {
      return false;
    }
  }

  async sendDeviceAlert(
    emails: string[],
    device: string,
    field: string,
    value: number,
    sign: string,
    datetime: string,
    lowerRange: number,
    upperRange: number,
  ): Promise<boolean> {
    try {
      const promises = emails.map((email) => {
        const mail: sendGrid.MailDataRequired = {
          to: email,
          from: `Origin Smart Controls <${this.configService.get<string>('sendgrid.from')}>`,
          dynamicTemplateData: {
            device,
            field,
            value,
            sign,
            datetime,
            lowerRange,
            upperRange,
          },
          templateId: this.configService.get<string>(
            'sendgrid.deviceAlertTemplate',
          ),
        };
        return sendGrid.send(mail);
      });

      await Promise.all(promises);
    } catch {
      return false;
    }
  }
}
