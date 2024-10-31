import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AlertLog } from './schema/alert-log.schema';
import { AlertService } from '../alert/alert.service';
import { GetAlertLogsDto } from './dto/get-alert-logs.dto';
import { UpdateAlertLogDto } from './dto/update-alert-log.dto';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class AlertLogService {
  constructor(
    @InjectModel(AlertLog.name)
    private readonly alertLogModel: PaginatedModel<AlertLog>,
    @Inject(forwardRef(() => AlertService))
    private readonly alertService: AlertService,
  ) {}

  createAlertLog(alert: string): Promise<AlertLog> {
    return this.alertLogModel.create({ alert });
  }

  async getAlertLogs(query?: GetAlertLogsDto): Promise<Result<AlertLog>> {
    const { from, to, page, limit } = query;
    const adjustedTo = new Date(to);
    adjustedTo.setHours(23, 59, 59, 999);

    return this.alertLogModel.paginate(
      {
        createdAt: { $gte: from, $lte: adjustedTo },
      },
      {
        page,
        limit,
        populate: [
          {
            path: 'alert',
            select: 'name trigger',
          },
          {
            path: 'user',
            select: 'firstName lastName',
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
        populate: [
          {
            path: 'alert',
            select: 'name',
          },
          {
            path: 'user',
            select: 'firstName lastName',
          },
        ],
      },
    );

    if (!alertLog) {
      throw new NotFoundException(`Alert log #${alertLog} not found`);
    }

    return alertLog;
  }

  async getAlertLogByAlert(alert: string): Promise<AlertLog> {
    return this.alertLogModel.findOne({ alert }).sort({ createdAt: -1 });
  }

  async acceptAlertLog(
    user: string,
    id: string,
    accepted: boolean = true,
  ): Promise<void> {
    const alertLog = await this.alertLogModel.findByIdAndUpdate(
      id,
      { user, accepted },
      { new: true },
    );
    if (!alertLog) {
      throw new NotFoundException(`Alert #${id} not found`);
    }
    await this.alertService.deactivateAlert(alertLog.alert);
  }
}
