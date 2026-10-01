import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
