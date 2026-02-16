import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { UserRole } from '../users/user.entity';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/user.entity';

@Controller('buildings')
export class BuildingsController {
  constructor(private buildingsService: BuildingsService) {}

  @Get()
  findAll(@AuthUser() user: User) {
    return this.buildingsService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    return this.buildingsService.findOne(id, user.id);
  }

  @Post()
  create(
    @Body() body: { name: string; companyId: number; address?: string },
    @AuthUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create buildings');
    }
    return this.buildingsService.create(
      body.name,
      body.companyId,
      body.address,
      user.id,
    );
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; address?: string },
    @AuthUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update buildings');
    }
    return this.buildingsService.update(id, user.id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete buildings');
    }
    return this.buildingsService.delete(id, user.id);
  }

  @Post(':id/users')
  addUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number },
    @AuthUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can add users to buildings',
      );
    }
    return this.buildingsService.addUser(id, body.userId, user.id);
  }

  @Delete(':id/users/:userId')
  removeUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @AuthUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can remove users from buildings',
      );
    }
    return this.buildingsService.removeUser(id, userId, user.id);
  }
}
