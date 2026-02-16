import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Story } from '../stories/story.entity';

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
}
