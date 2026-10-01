import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './controllers/client.controller';
import { Client } from './models/client.entity';
import { ClientRepository } from './repository/client.repository';
import { ClientService } from './services/client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientController],
  providers: [ClientService, ClientRepository],
})
export class ClientModule {}
