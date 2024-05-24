import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import toJSON from '../../common/plugins/toJSON.plugin';
import {
  paginate,
  paginatedAggregation,
} from '../../common/plugins/pagination.plugin';

class Axis extends Document {
  @Prop({
    type: Number,
    required: true,
  })
  x: number;

  @Prop({
    type: Number,
    required: true,
  })
  y: number;
}

const AxisSchema = SchemaFactory.createForClass(Axis);

@Schema({
  timestamps: true,
})
export class Device extends Document {
  @Prop({
    type: String,
    unique: true,
    index: true,
    sparse: true,
  })
  oem?: string;

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
  })
  temperature?: number;

  @Prop({
    type: Number,
  })
  relativeHumidity?: number;

  @Prop({
    type: AxisSchema,
    required: true,
  })
  axis: Axis;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.plugin(toJSON);
DeviceSchema.plugin(paginate);
DeviceSchema.plugin(paginatedAggregation);
