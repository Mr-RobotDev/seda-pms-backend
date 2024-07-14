import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion(): string {
    return '🚀 Seda PMS (v2.0.0) is running! 🚀';
  }
}
