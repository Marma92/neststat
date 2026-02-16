import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';

@Entity()
export class Building {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  address?: string;

  @ManyToOne(() => Company, (company) => company.buildings)
  company: Company;

  @Column()
  companyId: number;

  @ManyToMany(() => User, (user) => user.buildings)
  @JoinTable({
    name: 'building_users',
    joinColumn: { name: 'building_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users: User[];
}
