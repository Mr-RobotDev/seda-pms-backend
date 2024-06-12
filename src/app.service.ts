import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🚀 Seda PMS (v1.0.3) is running! 🚀';
  }
}
