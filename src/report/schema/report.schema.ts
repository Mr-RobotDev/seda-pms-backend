import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Dashboard } from '../../dashboard/schema/dashboard.schema';
import toJSON from '../../common/plugins/toJSON.plugin';
import {
  paginate,
  paginatedAggregation,
} from '../../common/plugins/pagination.plugin';

@Schema({
  timestamps: true,
})
export class Report extends Document {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: [String],
    required: true,
  })
  recipients: string[];

  @Prop({
    type: Number,
    required: true,
  })
  frequency: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  enabled: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: Dashboard.name,
    required: true,
    index: true,
  })
  dashboard: Dashboard;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.plugin(toJSON);
ReportSchema.plugin(paginate);
ReportSchema.plugin(paginatedAggregation);
