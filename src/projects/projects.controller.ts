import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './dto/project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeamId, UserId } from '../common/decorators/user.decorator';

@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new project',
    description: 'Creates a new project within the authenticated user\'s team'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Project created successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Project name already exists in team'
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Invalid or missing authentication token'
  })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto, teamId, userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all projects for team',
    description: 'Retrieves all active projects for the authenticated user\'s team'
  })
  @ApiQuery({
    name: 'include_deleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted projects in results',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Projects retrieved successfully',
    type: [ProjectResponseDto]
  })
  async findAll(
    @TeamId() teamId: string,
    @Query('include_deleted') includeDeleted?: boolean,
  ): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll(teamId, includeDeleted === true);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get team project statistics',
    description: 'Returns project count statistics for the team'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total_projects: { type: 'number', example: 10 },
        active_projects: { type: 'number', example: 8 },
        deleted_projects: { type: 'number', example: 2 }
      }
    }
  })
  async getStats(@TeamId() teamId: string) {
    return this.projectsService.getTeamStats(teamId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get project by ID',
    description: 'Retrieves a specific project by its ID within the team scope'
  })
  @ApiParam({
    name: 'id',
    description: 'Project ObjectId',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Project retrieved successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project not found or access denied'
  })
  async findOne(
    @Param('id') id: string,
    @TeamId() teamId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id, teamId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update project',
    description: 'Updates a project\'s details. Only accessible to team members.'
  })
  @ApiParam({
    name: 'id',
    description: 'Project ObjectId',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Project updated successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project not found'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Project name already exists'
  })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto, teamId, userId);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Soft delete project',
    description: 'Soft deletes a project (can be restored later). Associated tasks remain.'
  })
  @ApiParam({
    name: 'id',
    description: 'Project ObjectId',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Project deleted successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project not found'
  })
  async remove(
    @Param('id') id: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<void> {
    await this.projectsService.remove(id, teamId, userId);
  }

  @Post(':id/restore')
  @ApiOperation({ 
    summary: 'Restore deleted project',
    description: 'Restores a soft-deleted project back to active state'
  })
  @ApiParam({
    name: 'id',
    description: 'Project ObjectId',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Project restored successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Deleted project not found'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Cannot restore: name conflicts with existing project'
  })
  async restore(
    @Param('id') id: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.restore(id, teamId, userId);
  }
}