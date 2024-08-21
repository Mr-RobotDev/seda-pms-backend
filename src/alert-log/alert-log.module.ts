import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertLogService } from './alert-log.service';
import { AlertLogController } from './alert-log.controller';
import { AlertLog, AlertLogSchema } from './schema/alert-log.schema';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AlertLog.name,
        schema: AlertLogSchema,
      },
    ]),
    forwardRef(() => AlertModule),
  ],
  controllers: [AlertLogController],
  providers: [AlertLogService],
  exports: [AlertLogService],
})
export class AlertLogModule {}
