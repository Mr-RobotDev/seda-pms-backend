import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import toJSON from '../../common/plugins/toJSON.plugin';
import {
  paginate,
  paginatedAggregation,
} from '../../common/plugins/pagination.plugin';
import { Alert } from '../../alert/schema/alert.schema';
import { User } from '../../user/schema/user.schema';

@Schema({
  timestamps: true,
})
export class AlertLog extends Document {
  @Prop({
    type: Boolean,
    default: false,
  })
  accepted: boolean;

  @Prop({
    type: String,
  })
  notes?: string;

  @Prop({
    type: String,
    ref: Alert.name,
    required: true,
    index: true,
  })
  alert: string;

  @Prop({
    type: String,
    ref: User.name,
    sparse: true,
    index: true,
  })
  user?: string;
}

export const AlertLogSchema = SchemaFactory.createForClass(AlertLog);

AlertLogSchema.plugin(toJSON);
AlertLogSchema.plugin(paginate);
AlertLogSchema.plugin(paginatedAggregation);
