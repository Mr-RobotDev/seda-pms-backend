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
export class Device extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  oem: string;

  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
  })
  type: string;

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

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.plugin(toJSON);
DeviceSchema.plugin(paginate);
DeviceSchema.plugin(paginatedAggregation);
