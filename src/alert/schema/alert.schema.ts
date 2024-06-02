import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Trigger, TriggerSchema } from './trigger.schema';
import { Device } from '../../device/schema/device.schema';

@Schema({
  timestamps: true,
})
export class Alert extends Document {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: [Types.ObjectId],
    ref: Device.name,
    required: true,
  })
  devices: Device[];

  @Prop({
    type: [String],
    required: true,
  })
  recipients: string[];

  @Prop({
    type: TriggerSchema,
    required: true,
  })
  trigger: Trigger;

  @Prop({
    type: Boolean,
    default: true,
  })
  enabled: boolean;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
