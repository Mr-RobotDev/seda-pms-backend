import { Module } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangeLog, ChangeLogSchema } from './schema/changelog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ChangeLog.name,
        schema: ChangeLogSchema,
      },
    ]),
  ],
  controllers: [ChangelogController],
  providers: [ChangelogService],
})
export class ChangelogModule {}
