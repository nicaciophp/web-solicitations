import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Client } from '../models/client.entity';
import { ClientService } from '../services/client.service';

@ApiTags('clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @ApiOkResponse({ type: Client, isArray: true })
  findAll(): Promise<Client[]> {
    return this.clientService.findAll();
  }
}
