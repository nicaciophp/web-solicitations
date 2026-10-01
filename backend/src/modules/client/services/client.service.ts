import { Injectable } from '@nestjs/common';
import { Client } from '../models/client.entity';
import { ClientRepository } from '../repository/client.repository';

@Injectable()
export class ClientService {
  constructor(private readonly clientRepository: ClientRepository) {}

  findAll(): Promise<Client[]> {
    return this.clientRepository.find();
  }
}
