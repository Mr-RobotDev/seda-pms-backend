import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Device } from '../../device/schema/device.schema';
import toJSON from '../../common/plugins/toJSON.plugin';
import {
  paginate,
  paginatedAggregation,
} from '../../common/plugins/pagination.plugin';

@Schema({
  timestamps: true,
})
export class Event extends Document {
  @Prop({
    type: Number,
  })
  temperature?: number;

  @Prop({
    type: Number,
  })
  relativeHumidity?: number;

  @Prop({
    type: Number,
  })
  pressure?: number;

  @Prop({
    type: Types.ObjectId,
    ref: Device.name,
    required: true,
    index: true,
  })
  device: Device;

  createdAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.plugin(toJSON);
EventSchema.plugin(paginate);
EventSchema.plugin(paginatedAggregation);
