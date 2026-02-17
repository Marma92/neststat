import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { StoriesModule } from '../stories/stories.module';
import { BuildingsModule } from '../buildings/buildings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Room, User]),
    StoriesModule,
    BuildingsModule,
  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {}
