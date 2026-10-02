import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from '../dtos/create-client.dto';
import { UpdateClientDto } from '../dtos/update-client.dto';
import { Client } from '../models/client.entity';
import { ClientRepository } from '../repository/client.repository';

@Injectable()
export class ClientService {
  constructor(private readonly clientRepository: ClientRepository) {}

  findAll(): Promise<Client[]> {
    return this.clientRepository.find();
  }

  create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.clientRepository.preload({ id, ...updateClientDto });
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return this.clientRepository.save(client);
  }
}
