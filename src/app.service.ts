import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🚀 Seda PMS (v0.0.1) is running! 🚀';
  }
}
