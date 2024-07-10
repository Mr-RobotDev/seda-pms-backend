import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import toJSON from '../../common/plugins/toJSON.plugin';

@Schema({
  timestamps: true,
})
export class ChangeLog extends Document {
  @Prop({
    type: String,
    required: true,
  })
  version: string;

  @Prop({
    type: String,
    required: true,
  })
  change: string;
}

export const ChangeLogSchema = SchemaFactory.createForClass(ChangeLog);

ChangeLogSchema.plugin(toJSON);
