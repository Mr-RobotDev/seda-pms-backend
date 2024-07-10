import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeLog } from './schema/changelog.schema';
import { CreateChangeLogDto } from './dto/create-changelog.dto';
import { GetChangeLogsQueryDto } from './dto/get-changelogs.dto';

@Injectable()
export class ChangelogService {
  constructor(
    @InjectModel(ChangeLog.name)
    private readonly changeLogModel: Model<ChangeLog>,
  ) {}

  async createChangeLog(
    createChangeLogDto: CreateChangeLogDto,
  ): Promise<ChangeLog> {
    return this.changeLogModel.create(createChangeLogDto);
  }

  async getChangeLogs(
    getChangeLogsDto: GetChangeLogsQueryDto,
  ): Promise<ChangeLog[]> {
    const { from, to } = getChangeLogsDto;
    const adjustedTo = new Date(to);
    adjustedTo.setHours(23, 59, 59, 999);

    return this.changeLogModel.find({
      createdAt: { $gte: from, $lte: adjustedTo },
    });
  }

  async getLatestChangeLogVersion(): Promise<Partial<ChangeLog>> {
    return this.changeLogModel
      .findOne()
      .sort({ createdAt: -1 })
      .select('version');
  }
}
