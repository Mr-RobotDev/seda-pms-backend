import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  _id: false,
  versionKey: false,
})
export class Location extends Document {
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

export const LocationSchema = SchemaFactory.createForClass(Location);
