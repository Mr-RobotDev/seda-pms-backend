import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RangeType, RangeTypeValues } from '../enums/range-type.enum';

@Schema({
  _id: false,
  versionKey: false,
})
export class Range extends Document {
  @Prop({
    type: Number,
    required: function () {
      return (
        this.type === RangeType.OUTSIDE ||
        this.type === RangeType.INSIDE ||
        this.type === RangeType.LOWER
      );
    },
  })
  lower: number;

  @Prop({
    type: Number,
    required: function () {
      return (
        this.type === RangeType.OUTSIDE ||
        this.type === RangeType.INSIDE ||
        this.type === RangeType.UPPER
      );
    },
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
