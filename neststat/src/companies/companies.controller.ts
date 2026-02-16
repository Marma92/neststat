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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

/**
 * Companies controller handling company CRUD operations
 * Only administrators can access these endpoints
 */
@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  private checkAdmin(user: User): void {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can manage companies');
    }
  }

  /**
   * Retrieve all companies in the system
   * @param user - Current authenticated user (must be admin)
   * @returns List of all companies
   */
  @Get()
  @ApiOperation({ summary: 'Get all companies (admin only)' })
  @ApiResponse({ status: 200, description: 'List of companies' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  findAll(@AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.findAll();
  }

  /**
   * Retrieve a specific company by ID
   * @param id - Company ID
   * @param user - Current authenticated user (must be admin)
   * @returns Company data
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.findOne(id);
  }

  /**
   * Create a new company
   * @param body - Company details (name)
   * @param user - Current authenticated user (must be admin)
   * @returns Newly created company
   */
  @Post()
  @ApiOperation({ summary: 'Create a new company (admin only)' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  create(@Body() body: CreateCompanyDto, @AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.create(body.name);
  }

  /**
   * Update an existing company
   * @param id - Company ID
   * @param body - Updated company details
   * @param user - Current authenticated user (must be admin)
   * @returns Updated company data
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a company (admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCompanyDto,
    @AuthUser() user: User,
  ) {
    this.checkAdmin(user);
    return this.companiesService.update(id, body.name);
  }

  /**
   * Delete a company
   * @param id - Company ID
   * @param user - Current authenticated user (must be admin)
   * @returns Success message
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company (admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  delete(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    this.checkAdmin(user);
    return this.companiesService.delete(id);
  }
}
