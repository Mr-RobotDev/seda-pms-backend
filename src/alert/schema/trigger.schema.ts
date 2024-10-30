import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Range, RangeSchema } from './range.schema';
import { Field, FieldValues } from '../../common/enums/field.enum';

@Schema({
  _id: false,
  versionKey: false,
})
export class Trigger extends Document {
  @Prop({
    type: String,
    required: true,
    enum: FieldValues,
  })
  field: Field;

  @Prop({
    type: RangeSchema,
    required: true,
  })
  range: Range;

  @Prop({
    type: Number,
    required: true,
  })
  duration: number;

  @Prop({
    type: Number,
    required: true,
  })
  value: number;

  @Prop({
    type: String,
    required: true,
  })
  unit: string;
}

export const TriggerSchema = SchemaFactory.createForClass(Trigger);
