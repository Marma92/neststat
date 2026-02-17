import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';

/**
 * Reservation entity representing a room booking
 */
@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @ManyToOne(() => Room, (room) => room.reservations)
  room: Room;

  @Column()
  roomId: number;

  @ManyToOne(() => User, (user) => user.reservations)
  organizer: User;

  @Column()
  organizerId: number;

  @ManyToMany(() => User)
  @JoinTable()
  invitees: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
