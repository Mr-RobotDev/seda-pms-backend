import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { Alert, AlertSchema } from './schema/alert.schema';
import { DeviceModule } from '../device/device.module';
import { AlertLogModule } from '../alert-log/alert-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Alert.name,
        schema: AlertSchema,
      },
    ]),
    forwardRef(() => DeviceModule),
    AlertLogModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
