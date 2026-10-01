import { Controller, Get } from '@nestjs/common';
import { Client } from '../models/client.entity';
import { ClientService } from '../services/client.service';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  findAll(): Promise<Client[]> {
    return this.clientService.findAll();
  }
}
