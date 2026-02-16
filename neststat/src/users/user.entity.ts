import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { Company } from '../companies/company.entity';
import { Building } from '../buildings/building.entity';

export enum UserRole {
  ADMIN = 'admin',
  HANDLER = 'handler',
  USER = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', default: UserRole.USER })
  role: UserRole;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  company: Company;

  @Column({ nullable: true })
  companyId?: number;

  @ManyToMany(() => Building, (building) => building.users)
  buildings: Building[];
}
