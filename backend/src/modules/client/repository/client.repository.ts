import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Client } from '../models/client.entity';

@Injectable()
export class ClientRepository extends Repository<Client> {
  constructor(private readonly dataSource: DataSource) {
    super(Client, dataSource.createEntityManager());
  }
}
