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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateRoomDto,
  UpdateRoomDto,
  BulkCreateRoomsDto,
} from './dto/room.dto';

/**
 * Rooms controller handling room CRUD operations within a story/floor
 */
@ApiTags('rooms')
@ApiBearerAuth()
@Controller('buildings/:buildingId/stories/:storyId/rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  /**
   * Retrieve all rooms for a specific story
   * @param storyId - Story ID
   * @param user - Current authenticated user
   * @returns List of rooms for the story
   */
  @Get()
  @ApiOperation({ summary: 'Get all rooms for a story' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'List of rooms' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  findAll(
    @Param('storyId', ParseIntPipe) storyId: number,
    @AuthUser() user: User,
  ) {
    return this.roomsService.findAllForStory(storyId, user.id);
  }

  /**
   * Retrieve a specific room by ID
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param id - Room ID
   * @param user - Current authenticated user
   * @returns Room data
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.roomsService.findOne(id, user.id);
  }

  /**
   * Create a new room within a story
   * @param storyId - Story ID
   * @param body - Room details (name, description, capacity)
   * @param user - Current authenticated user
   * @returns Newly created room
   */
  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, description: 'Room created' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  create(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() body: CreateRoomDto,
    @AuthUser() user: User,
  ) {
    return this.roomsService.create(storyId, body, user.id, user.role);
  }

  /**
   * Create multiple rooms at once within a story
   * @param storyId - Story ID
   * @param body - Array of room details
   * @param user - Current authenticated user (admin only)
   * @returns Array of newly created rooms
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple rooms at once (admin only)' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiBody({ type: BulkCreateRoomsDto })
  @ApiResponse({ status: 201, description: 'Rooms created' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  bulkCreate(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() body: BulkCreateRoomsDto,
    @AuthUser() user: User,
  ) {
    return this.roomsService.bulkCreate(
      storyId,
      body.rooms,
      user.id,
      user.role,
    );
  }

  /**
   * Update an existing room
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param id - Room ID
   * @param body - Updated room details
   * @param user - Current authenticated user (admin only for updates)
   * @returns Updated room data
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a room' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({ status: 200, description: 'Room updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  update(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoomDto,
    @AuthUser() user: User,
  ) {
    return this.roomsService.update(id, user.id, user.role, body);
  }

  /**
   * Delete a room
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param id - Room ID
   * @param user - Current authenticated user (admin only for deletion)
   * @returns Success message
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Room deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  delete(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.roomsService.delete(id, user.id, user.role);
  }
}
