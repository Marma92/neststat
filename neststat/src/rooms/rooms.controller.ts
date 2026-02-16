import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/user.entity';

@Controller('buildings/:buildingId/stories/:storyId/rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  findAll(
    @Param('storyId', ParseIntPipe) storyId: number,
    @AuthUser() user: User,
  ) {
    return this.roomsService.findAllForStory(storyId, user.id);
  }

  @Get(':id')
  findOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.roomsService.findOne(id, user.id);
  }

  @Post()
  create(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() body: { name: string; description?: string; capacity?: number },
    @AuthUser() user: User,
  ) {
    return this.roomsService.create(storyId, body, user.id, user.role);
  }

  @Put(':id')
  update(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; capacity?: number },
    @AuthUser() user: User,
  ) {
    return this.roomsService.update(id, user.id, user.role, body);
  }

  @Delete(':id')
  delete(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.roomsService.delete(id, user.id, user.role);
  }
}
