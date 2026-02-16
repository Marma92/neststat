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
import { StoriesService } from './stories.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/user.entity';

@Controller('buildings/:buildingId/stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Get()
  findAll(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @AuthUser() user: User,
  ) {
    return this.storiesService.findAllForBuilding(buildingId, user.id);
  }

  @Get(':id')
  findOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.storiesService.findOne(id, user.id);
  }

  @Post()
  create(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Body() body: { name: string; floor: number },
    @AuthUser() user: User,
  ) {
    return this.storiesService.create(
      buildingId,
      body.name,
      body.floor,
      user.id,
      user.role,
    );
  }

  @Put(':id')
  update(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; floor?: number },
    @AuthUser() user: User,
  ) {
    return this.storiesService.update(id, user.id, user.role, body);
  }

  @Delete(':id')
  delete(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.storiesService.delete(id, user.id, user.role);
  }
}
