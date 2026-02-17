import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from '../stories/story.entity';
import { Reservation } from '../reservations/reservation.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 1 })
  capacity: number;

  @ManyToOne(() => Story, (story) => story.rooms)
  story: Story;

  @Column()
  storyId: number;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
