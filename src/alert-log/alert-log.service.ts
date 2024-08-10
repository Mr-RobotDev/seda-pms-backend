import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AlertLog } from './schema/alert-log.schema';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';
import { UpdateAlertLogDto } from './dto/update-alert-log.dto';

@Injectable()
export class AlertLogService {
  constructor(
    @InjectModel(AlertLog.name)
    private readonly alertLogModel: PaginatedModel<AlertLog>,
  ) {}

  createAlertLog(alert: string): Promise<AlertLog> {
    return this.alertLogModel.create({ alert });
  }

  async getAlertLogs(query: PaginationQueryDto): Promise<Result<AlertLog>> {
    const { page, limit } = query;
    return this.alertLogModel.paginate(
      {},
      {
        page,
        limit,
        populate: [
          {
            path: 'alert',
            select: 'name',
          },
          {
            path: 'user',
            select: 'name',
          },
        ],
      },
    );
  }

  async updateAlertLog(
    id: string,
    updateAlertLogDto: UpdateAlertLogDto,
  ): Promise<AlertLog> {
    const alertLog = await this.alertLogModel.findByIdAndUpdate(
      id,
      updateAlertLogDto,
      {
        new: true,
      },
    );

    if (!alertLog) {
      throw new NotFoundException(`Alert log #${alertLog} not found`);
    }

    return alertLog;
  }

  async acceptAlertLog(user: string, id: string): Promise<AlertLog> {
    const alertLog = await this.alertLogModel.findByIdAndUpdate(
      id,
      { user, accepted: true },
      { new: true },
    );

    if (!alertLog) {
      throw new NotFoundException(`Alert log #${alertLog} not found`);
    }

    return alertLog;
  }
}
