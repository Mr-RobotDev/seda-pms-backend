import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Report } from './schema/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: PaginatedModel<Report>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendReports() {
    const reports = await this.reportModel.find({
      enabled: true,
    });

    for (const report of reports) {
      console.log(`Sending report #${report._id}`);
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
