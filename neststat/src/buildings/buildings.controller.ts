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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateBuildingDto,
  UpdateBuildingDto,
  AddUserToBuildingDto,
} from './dto/building.dto';

/**
 * Buildings controller handling building CRUD operations and user management
 * Users can view buildings they have access to, admins can modify them
 */
@ApiTags('buildings')
@ApiBearerAuth()
@Controller('buildings')
export class BuildingsController {
  constructor(private buildingsService: BuildingsService) {}

  /**
   * Retrieve all buildings the current user has access to
   * @param user - Current authenticated user
   * @returns List of accessible buildings
   */
  @Get()
  @ApiOperation({ summary: 'Get all buildings for current user' })
  @ApiResponse({ status: 200, description: 'List of buildings' })
  findAll(@AuthUser() user: User) {
    return this.buildingsService.findAllForUser(user.id);
  }

  /**
   * Retrieve a specific building by ID
   * @param id - Building ID
   * @param user - Current authenticated user
   * @returns Building data
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Building found' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    return this.buildingsService.findOne(id, user.id);
  }

  /**
   * Create a new building
   * @param body - Building details (name, companyId, address)
   * @param user - Current authenticated user (must be admin)
   * @returns Newly created building
   */
  @Post()
  @ApiOperation({ summary: 'Create a new building (admin only)' })
  @ApiBody({ type: CreateBuildingDto })
  @ApiResponse({ status: 201, description: 'Building created' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  create(
    @Body() body: CreateBuildingDto,
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

  /**
   * Update an existing building
   * @param id - Building ID
   * @param body - Updated building details
   * @param user - Current authenticated user (must be admin)
   * @returns Updated building data
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a building (admin only)' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiBody({ type: UpdateBuildingDto })
  @ApiResponse({ status: 200, description: 'Building updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBuildingDto,
    @AuthUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update buildings');
    }
    return this.buildingsService.update(id, user.id, body);
  }

  /**
   * Delete a building
   * @param id - Building ID
   * @param user - Current authenticated user (must be admin)
   * @returns Success message
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a building (admin only)' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Building deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  delete(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete buildings');
    }
    return this.buildingsService.delete(id, user.id);
  }

  /**
   * Add a user to a building, granting them access
   * @param id - Building ID
   * @param body - User ID to add
   * @param user - Current authenticated user (must be admin)
   * @returns Success message
   */
  @Post(':id/users')
  @ApiOperation({ summary: 'Add user to building (admin only)' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiBody({ type: AddUserToBuildingDto })
  @ApiResponse({ status: 201, description: 'User added to building' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  addUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddUserToBuildingDto,
    @AuthUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can add users to buildings',
      );
    }
    return this.buildingsService.addUser(id, body.userId, user.id);
  }

  /**
   * Remove a user from a building, revoking their access
   * @param id - Building ID
   * @param userId - User ID to remove
   * @param user - Current authenticated user (must be admin)
   * @returns Success message
   */
  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Remove user from building (admin only)' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({ status: 200, description: 'User removed from building' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Building or user not found' })
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
