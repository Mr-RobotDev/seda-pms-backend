import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import toJSON from '../../common/plugins/toJSON.plugin';
import {
  paginate,
  paginatedAggregation,
} from '../../common/plugins/pagination.plugin';
import { DeviceType } from '../enums/device-type.enum';

@Schema({
  _id: false,
  versionKey: false,
})
class Location extends Document {
  @Prop({
    type: Number,
    required: true,
  })
  lat: number;

  @Prop({
    type: Number,
    required: true,
  })
  long: number;
}

const LocationSchema = SchemaFactory.createForClass(Location);

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
      return this.type === DeviceType.COLD || this.type === DeviceType.HUMIDITY;
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
