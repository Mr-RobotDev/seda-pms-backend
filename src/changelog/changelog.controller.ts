import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { CreateChangeLogDto } from './dto/create-changelog.dto';
import { GetChangeLogsQueryDto } from './dto/get-changelogs.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Roles(Role.ADMIN)
@Controller({
  path: 'changelogs',
  version: '1',
})
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createChangeLog(@Body() createChangeLog: CreateChangeLogDto) {
    return this.changelogService.createChangeLog(createChangeLog);
  }

  @Get()
  async getChangeLogs(@Query() getChangeLogsDto: GetChangeLogsQueryDto) {
    return this.changelogService.getChangeLogs(getChangeLogsDto);
  }

  @Get('latest-version')
  async getLatestChangeLogVersion() {
    return this.changelogService.getLatestChangeLogVersion();
  }
}
