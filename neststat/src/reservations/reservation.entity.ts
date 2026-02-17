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
 * Manages room reservations with time slots, organizers, and invitees
 */
@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reservation title/name
   */
  @Column()
  title: string;

  /**
   * Optional detailed description of the reservation
   */
  @Column({ nullable: true })
  description?: string;

  /**
   * Start time of the reservation
   * Stored as datetime in SQLite for proper date comparison
   */
  @Column({ type: 'datetime' })
  startTime: Date;

  /**
   * End time of the reservation
   * Stored as datetime in SQLite for proper date comparison
   */
  @Column({ type: 'datetime' })
  endTime: Date;

  /**
   * Room being reserved
   */
  @ManyToOne(() => Room, (room) => room.reservations)
  room: Room;

  /**
   * ID of the room being reserved
   */
  @Column()
  roomId: number;

  /**
   * User who created/organized the reservation
   */
  @ManyToOne(() => User, (user) => user.reservations)
  organizer: User;

  /**
   * ID of the organizer
   */
  @Column()
  organizerId: number;

  /**
   * Users invited to the reservation
   */
  @ManyToMany(() => User)
  @JoinTable()
  invitees: User[];

  /**
   * Timestamp when the reservation was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the reservation was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
