import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion(): string {
    return '🚀 Seda PMS (v1.0.7) is running! 🚀';
  }
}
