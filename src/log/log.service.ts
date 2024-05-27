import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Log } from './schema/log.schema';
import { CreateLogDto } from './dto/create-log.dto';
import { GetUserLogsQueryDto } from './dto/get-user-logs.dto';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';

@Injectable()
export class LogService {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: PaginatedModel<Log>,
  ) {}

  createLog(user: string, createLogDto: CreateLogDto) {
    return this.logModel.create({ user, ...createLogDto });
  }

  getUserLogs(query: GetUserLogsQueryDto) {
    const { user, page, limit } = query;
    return this.logModel.paginate(
      { user },
      {
        page,
        limit,
        populate: [
          {
            path: 'user',
            select: 'firstName lastName profile',
          },
          {
            path: 'device',
            select: 'name',
          },
        ],
      },
    );
  }
}
