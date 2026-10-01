import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  check() {
    return {
      status: 'ok',
      database: this.dataSource.isInitialized ? 'connected' : 'disconnected',
    };
  }
}
