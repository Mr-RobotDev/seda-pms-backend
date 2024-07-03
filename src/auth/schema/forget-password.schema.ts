import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ForgotPassword {
  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  })
  email: string;

  @Prop({
    type: Date,
    required: true,
    expires: 3600,
  })
  emailSentAt: Date;
}

export const ForgotPasswordSchema =
  SchemaFactory.createForClass(ForgotPassword);
