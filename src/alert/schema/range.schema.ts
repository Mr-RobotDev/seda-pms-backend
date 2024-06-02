import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RangeType, RangeTypeValues } from '../enums/range-type.enum';

@Schema({
  _id: false,
  timestamps: true,
})
export class Range extends Document {
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  lower: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  upper: number;

  @Prop({
    type: String,
    required: true,
    enum: RangeTypeValues,
  })
  type: RangeType;
}

export const RangeSchema = SchemaFactory.createForClass(Range);
