import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Location, LocationSchema } from './location.schema';
import { DeviceType, DeviceTypeValues } from '../enums/device-type.enum';
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
    unique: true,
    index: true,
    sparse: true,
    required: function (this: Device) {
      return this.type !== DeviceType.PRESSURE;
    },
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
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: String,
    required: true,
    enum: DeviceTypeValues,
  })
  type: DeviceType;

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
    type: Number,
  })
  signalStrength?: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isOffline?: boolean;

  @Prop({
    type: Date,
  })
  lastUpdated?: Date;

  @Prop({
    type: LocationSchema,
    required: true,
  })
  location: Location;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ oem: 1, name: 1 });

DeviceSchema.plugin(toJSON);
DeviceSchema.plugin(paginate);
DeviceSchema.plugin(paginatedAggregation);
