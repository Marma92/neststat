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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';

/**
 * Stories controller handling story/floor CRUD operations within a building
 */
@ApiTags('stories')
@ApiBearerAuth()
@Controller('buildings/:buildingId/stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  /**
   * Retrieve all stories/floors for a specific building
   * @param buildingId - Building ID
   * @param user - Current authenticated user
   * @returns List of stories for the building
   */
  @Get()
  @ApiOperation({ summary: 'Get all stories for a building' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'List of stories' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  findAll(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @AuthUser() user: User,
  ) {
    return this.storiesService.findAllForBuilding(buildingId, user.id);
  }

  /**
   * Retrieve a specific story by ID
   * @param buildingId - Building ID
   * @param id - Story ID
   * @param user - Current authenticated user
   * @returns Story data
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get story by ID' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'id', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Story found' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  findOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.storiesService.findOne(id, user.id);
  }

  /**
   * Create a new story/floor within a building
   * @param buildingId - Building ID
   * @param body - Story details (name, floor number)
   * @param user - Current authenticated user (admin only for creation)
   * @returns Newly created story
   */
  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiBody({ type: CreateStoryDto })
  @ApiResponse({ status: 201, description: 'Story created' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  create(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Body() body: CreateStoryDto,
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

  /**
   * Update an existing story
   * @param buildingId - Building ID
   * @param id - Story ID
   * @param body - Updated story details
   * @param user - Current authenticated user (admin only for updates)
   * @returns Updated story data
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a story' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'id', description: 'Story ID' })
  @ApiBody({ type: UpdateStoryDto })
  @ApiResponse({ status: 200, description: 'Story updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  update(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStoryDto,
    @AuthUser() user: User,
  ) {
    return this.storiesService.update(id, user.id, user.role, body);
  }

  /**
   * Delete a story
   * @param buildingId - Building ID
   * @param id - Story ID
   * @param user - Current authenticated user (admin only for deletion)
   * @returns Success message
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'id', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Story deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  delete(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.storiesService.delete(id, user.id, user.role);
  }
}
