import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
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
    type: String,
    required: true,
    index: true,
  })
  oem: string;

  @Prop({
    type: String,
    required: true,
  })
  eventType: string;

  @Prop({
    type: Number,
    required: true,
  })
  temperature: number;

  @Prop({
    type: Number,
    required: true,
  })
  relativeHumidity: number;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.plugin(toJSON);
EventSchema.plugin(paginate);
EventSchema.plugin(paginatedAggregation);
