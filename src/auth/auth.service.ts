import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ForgotPassword } from './schema/forget-password.schema';
import { UserService } from '../user/user.service';
import { CryptoService } from '../common/services/crypto.service';
import { MailService } from '../common/services/mail.service';
import { LogService } from '../log/log.service';
import { LoginDto } from './dto/login.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Action } from '../log/enums/action.enum';
import { LoginSuccess } from './types/login-success.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(ForgotPassword.name)
    private ForgotPasswordModel: Model<ForgotPassword>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly logService: LogService,
  ) {}

  async login(loginDto: LoginDto, userAgent: string): Promise<LoginSuccess> {
    const user = await this.userService.getUserByEmail(loginDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new BadRequestException('Your account is not active!');
    }

    await this.logService.createLog(user.id, {
      action: Action.LOGGED_IN,
      userAgent,
    });

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async logout(user: string, userAgent: string): Promise<void> {
    await this.logService.createLog(user, {
      action: Action.LOGGED_OUT,
      userAgent,
    });
  }

  async forgotPassword(forgetPasswordDto: ForgetPasswordDto): Promise<{
    emailSent: boolean;
  }> {
    const forgetPasswordUser = await this.ForgotPasswordModel.findOne({
      email: forgetPasswordDto.email,
    });
    if (forgetPasswordUser) {
      throw new BadRequestException('Email already sent');
    }

    const user = await this.userService.getUserByEmail(forgetPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const key = await this.cryptoService.encrypt(forgetPasswordDto.email);

    const link = `${this.configService.get(
      'frontend.url',
    )}/reset-password?key=${key}`;

    const sent = await this.mailService.sendForgotPasswordEmail(
      forgetPasswordDto.email,
      `${user.firstName} ${user.lastName}`,
      link,
    );
    if (!sent) {
      throw new BadGatewayException('Failed to send email');
    }

    await this.ForgotPasswordModel.create({
      email: forgetPasswordDto.email,
      emailSentAt: new Date(),
    });
    return { emailSent: true };
  }

  async resetPassword(
    key: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{
    resetPassword: boolean;
  }> {
    const email = await this.cryptoService.decrypt(key);

    const forgetPasswordUser = await this.ForgotPasswordModel.findOne({
      email,
    });
    if (!forgetPasswordUser) {
      throw new BadRequestException('Invalid reset password link');
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = resetPasswordDto.password;
    await user.save();
    await this.ForgotPasswordModel.deleteOne({ email });
    return { resetPassword: true };
  }
}
