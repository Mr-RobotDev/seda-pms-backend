import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Alert } from './schema/alert.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RangeType } from './enums/range-type.enum';
import { Field } from '../common/enums/field.enum';
import { WeekDay } from '../common/enums/week-day.enum';
import { ScheduleType } from '../common/enums/schedule-type.enum';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: PaginatedModel<Alert>,
  ) {}

  async filterAlerts(device: string, field: Field): Promise<Alert[]> {
    return this.alertModel.find(
      {
        device,
        enabled: true,
        'trigger.field': field,
      },
      '-createdAt',
      {
        populate: {
          path: 'device',
          select: 'name lastUpdated',
        },
      },
    );
  }

  shouldSendAlert(
    alert: Alert,
    currentDay: WeekDay,
    filedValue: number,
  ): boolean {
    if (
      alert.scheduleType === ScheduleType.EVERYDAY ||
      (alert.scheduleType === ScheduleType.WEEKDAYS &&
        ![WeekDay.SATURDAY, WeekDay.SUNDAY].includes(currentDay)) ||
      (alert.scheduleType === ScheduleType.CUSTOM &&
        alert.weekdays.includes(currentDay))
    ) {
      if (alert.trigger.range.type === RangeType.INSIDE) {
        return (
          filedValue >= alert.trigger.range.lower &&
          filedValue <= alert.trigger.range.upper
        );
      } else if (alert.trigger.range.type === RangeType.OUTSIDE) {
        return (
          filedValue < alert.trigger.range.lower ||
          filedValue > alert.trigger.range.upper
        );
      } else if (alert.trigger.range.type === RangeType.LOWER) {
        return filedValue < alert.trigger.range.lower;
      }
      return filedValue > alert.trigger.range.upper;
    }
    return false;
  }

  async createAlert(createAlertDto: CreateAlertDto): Promise<Alert> {
    const newAlert = await this.alertModel.create(createAlertDto);
    return this.getAlert(newAlert.id);
  }

  async getAlerts(query: PaginationQueryDto): Promise<Result<Alert>> {
    const { page, limit } = query;
    return this.alertModel.paginate(
      {},
      {
        page,
        limit,
        projection: '-createdAt',
        populate: [
          {
            path: 'device',
            select: 'name',
          },
        ],
      },
    );
  }

  async getAlert(id: string): Promise<Alert> {
    const alert = await this.alertModel.findById(id, '-createdAt', {
      populate: {
        path: 'device',
        select: 'name lastUpdated temperature relativeHumidity pressure',
      },
    });
    if (!alert) {
      throw new NotFoundException(`Alert #${id} not found`);
    }
    return alert;
  }

  async updateAlert(
    id: string,
    updateAlertDto: UpdateAlertDto,
  ): Promise<Alert> {
    const updatedAlert = await this.alertModel.findByIdAndUpdate(
      id,
      updateAlertDto,
      {
        new: true,
        projection: '-createdAt',
        populate: {
          path: 'device',
          select: 'name lastUpdated temperature relativeHumidity pressure',
        },
      },
    );
    if (!updatedAlert) {
      throw new NotFoundException(`Alert #${id} not found`);
    }
    return updatedAlert;
  }

  async removeAlert(id: string): Promise<void> {
    const result = await this.alertModel.findByIdAndDelete(id, {
      projection: '-createdAt',
      populate: {
        path: 'device',
        select: 'name lastUpdated temperature relativeHumidity pressure',
      },
    });
    if (!result) {
      throw new NotFoundException(`Alert #${id} not found`);
    }
  }
}
