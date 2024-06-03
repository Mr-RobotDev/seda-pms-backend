import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfDay,
  endOfDay,
} from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { Report } from './schema/report.schema';
import { MailService } from '../common/services/mail.service';
import { CardService } from '../card/card.service';
import { EventService } from '../event/event.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CustomDay } from './enums/custom-day.enum';
import { ScheduleType } from './enums/schedule-type.enum';
import { TimeFrame } from './enums/timeframe.enum';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: PaginatedModel<Report>,
    private readonly mailService: MailService,
    private readonly cardService: CardService,
    private readonly eventService: EventService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendReports() {
    const currentDay = format(new Date(), 'EEEE').toLowerCase() as CustomDay;
    const currentTime = format(new Date(), 'HH:mm');

    const reports = await this.reportModel.find({ enabled: true }, null, {
      populate: {
        path: 'dashboard',
        select: 'name',
      },
    });

    for (const report of reports) {
      if (this.shouldSendReport(report, currentDay, currentTime)) {
        const { from, to } = this.getTimeFrameRange(report.timeFrame);
        const cards = await this.cardService.cards(report.dashboard.id);
        for (const card of cards) {
          for (const device of card.devices) {
            const events = await this.eventService.getEvents({
              oem: device.oem,
              eventTypes: card.field,
              from,
              to,
            });

            if (events.length > 0) {
              const filePath = await this.eventService.getFilePath(
                events,
                device,
                from,
                to,
              );
              const attachment = {
                filename: path.basename(filePath),
                content: fs.readFileSync(filePath).toString('base64'),
              };

              await this.mailService.sendDashboardReport(
                report.recipients,
                [attachment],
                report.dashboard.name,
                from,
                to,
              );
            }
          }
        }
      }
    }
  }

  shouldSendReport(
    report: Report,
    currentDay: CustomDay,
    currentTime: string,
  ): boolean {
    if (
      report.scheduleType === ScheduleType.EVERYDAY ||
      (report.scheduleType === ScheduleType.WEEKDAYS &&
        ![CustomDay.SATURDAY, CustomDay.SUNDAY].includes(currentDay)) ||
      (report.scheduleType === ScheduleType.CUSTOM &&
        report.customDays.includes(currentDay))
    ) {
      return report.times.includes(currentTime);
    }
    return false;
  }

  getTimeFrameRange(timeFrame: TimeFrame): { from: Date; to: Date } {
    const now = new Date();
    switch (timeFrame) {
      case TimeFrame.TODAY:
        return { from: startOfDay(now), to: endOfDay(now) };
      case TimeFrame.YESTERDAY:
        return {
          from: startOfDay(subDays(now, 1)),
          to: endOfDay(subDays(now, 1)),
        };
      case TimeFrame.THIS_WEEK:
        return { from: startOfWeek(now), to: now };
      case TimeFrame.LAST_WEEK:
        return {
          from: startOfWeek(subWeeks(now, 1)),
          to: endOfWeek(subWeeks(now, 1)),
        };
      case TimeFrame.LAST_3_DAYS:
        return { from: subDays(now, 3), to: now };
      case TimeFrame.LAST_7_DAYS:
        return { from: subDays(now, 7), to: now };
      case TimeFrame.LAST_30_DAYS:
        return { from: subDays(now, 30), to: now };
      default:
        throw new Error(`Unsupported time frame: ${timeFrame}`);
    }
  }

  async createReport(
    dashboard: string,
    createReportDto: CreateReportDto,
  ): Promise<Report> {
    const newReport = await this.reportModel.create({
      ...createReportDto,
      dashboard,
    });
    const report = await this.report(dashboard, newReport.id);
    return report;
  }

  async reports(
    dashboard: string,
    query: PaginationQueryDto,
  ): Promise<Result<Report>> {
    const { page, limit } = query;
    return this.reportModel.paginate(
      { dashboard },
      {
        page,
        limit,
        projection: '-createdAt',
        populate: [
          {
            path: 'dashboard',
            select: '-cardsCount -createdAt',
          },
        ],
      },
    );
  }

  async report(dashboard: string, id: string): Promise<Report> {
    const report = await this.reportModel.findOne(
      { _id: id, dashboard },
      '-createdAt',
      {
        populate: {
          path: 'dashboard',
          select: '-cardsCount -createdAt',
        },
      },
    );
    if (!report) {
      throw new NotFoundException(`Report #${id} not found`);
    }
    return report;
  }

  async updateReport(
    dashboard: string,
    id: string,
    updateReportDto: UpdateReportDto,
  ): Promise<Report> {
    const report = await this.reportModel.findOneAndUpdate(
      { _id: id, dashboard },
      { $set: updateReportDto },
      {
        new: true,
        projection: '-createdAt',
        populate: {
          path: 'dashboard',
          select: '-cardsCount -createdAt',
        },
      },
    );
    if (!report) {
      throw new NotFoundException(`Report #${id} not found`);
    }
    return report;
  }

  async removeReport(dashboard: string, id: string): Promise<Report> {
    const report = await this.reportModel.findOneAndDelete(
      {
        _id: id,
        dashboard,
      },
      { projection: '-dashboard -createdAt' },
    );
    if (!report) {
      throw new NotFoundException(`Report #${id} not found`);
    }
    return report;
  }
}
