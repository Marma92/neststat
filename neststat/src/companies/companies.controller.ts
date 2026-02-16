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
import { CompaniesService } from './companies.service';
import { UserRole } from '../users/user.entity';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/user.entity';

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  private checkAdmin(user: User): void {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can manage companies');
    }
  }

  @Get()
  findAll(@AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string }, @AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.create(body.name);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string },
    @AuthUser() user: User,
  ) {
    this.checkAdmin(user);
    return this.companiesService.update(id, body.name);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.delete(id);
  }
}
