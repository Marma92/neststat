import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';
import { Building } from '../buildings/building.entity';
import { Reservation } from '../reservations/reservation.entity';

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

  @OneToMany(() => Reservation, (reservation) => reservation.organizer)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
