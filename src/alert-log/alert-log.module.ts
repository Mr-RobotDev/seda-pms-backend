import { Module } from '@nestjs/common';
import { AlertLogService } from './alert-log.service';
import { AlertLogController } from './alert-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertLog, AlertLogSchema } from './schema/alert-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AlertLog.name,
        schema: AlertLogSchema,
      },
    ]),
  ],
  controllers: [AlertLogController],
  providers: [AlertLogService],
  exports: [AlertLogService],
})
export class AlertLogModule {}
