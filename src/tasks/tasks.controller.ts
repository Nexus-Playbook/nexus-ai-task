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
  HttpCode,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskResponseDto, 
  TaskQueryDto 
} from './dto/task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeamId, UserId } from '../common/decorators/user.decorator';

@ApiTags('tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new task',
    description: 'Creates a new task within the authenticated user\'s team'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Task created successfully',
    type: TaskResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid task data'
  })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto, teamId, userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get tasks with filters',
    description: 'Retrieves tasks for the team with optional filtering and search'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Tasks retrieved successfully',
    type: [TaskResponseDto]
  })
  async findAll(
    @TeamId() teamId: string,
    @Query() query: TaskQueryDto,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.findAll(teamId, query);
  }

  @Get('kanban')
  @ApiOperation({ 
    summary: 'Get Kanban board view',
    description: 'Returns tasks organized by status columns for Kanban board'
  })
  @ApiQuery({
    name: 'project_id',
    required: false,
    description: 'Filter tasks by project ID',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Kanban board data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        todo: { type: 'array', items: { $ref: '#/components/schemas/TaskResponseDto' } },
        in_progress: { type: 'array', items: { $ref: '#/components/schemas/TaskResponseDto' } },
        done: { type: 'array', items: { $ref: '#/components/schemas/TaskResponseDto' } },
        blocked: { type: 'array', items: { $ref: '#/components/schemas/TaskResponseDto' } }
      }
    }
  })
  async getKanbanBoard(
    @TeamId() teamId: string,
    @Query('project_id') projectId?: string,
  ) {
    return this.tasksService.getKanbanBoard(teamId, projectId);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get task statistics',
    description: 'Returns task count statistics by status, priority, and completion'
  })
  @ApiQuery({
    name: 'project_id',
    required: false,
    description: 'Get stats for specific project',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        by_status: { 
          type: 'object',
          properties: {
            todo: { type: 'number' },
            in_progress: { type: 'number' },
            done: { type: 'number' },
            blocked: { type: 'number' }
          }
        },
        by_priority: { type: 'object' },
        overdue: { type: 'number' },
        completed_today: { type: 'number' }
      }
    }
  })
  async getStats(
    @TeamId() teamId: string,
    @Query('project_id') projectId?: string,
  ) {
    return this.tasksService.getTaskStats(teamId, projectId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get task by ID',
    description: 'Retrieves a specific task by its ID within the team scope'
  })
  @ApiParam({
    name: 'id',
    description: 'Task ObjectId',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task retrieved successfully',
    type: TaskResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Task not found'
  })
  async findOne(
    @Param('id') id: string,
    @TeamId() teamId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id, teamId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update task',
    description: 'Updates a task\'s details and adds history entry'
  })
  @ApiParam({
    name: 'id',
    description: 'Task ObjectId',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task updated successfully',
    type: TaskResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Task not found'
  })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, updateTaskDto, teamId, userId);
  }

  @Patch(':id/position')
  @ApiOperation({ 
    summary: 'Update task position',
    description: 'Updates task position for drag-drop reordering in Kanban'
  })
  @ApiParam({
    name: 'id',
    description: 'Task ObjectId',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task position updated successfully',
    type: TaskResponseDto
  })
  async updatePosition(
    @Param('id') id: string,
    @Body('position') position: number,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updatePosition(id, position, teamId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Soft delete task',
    description: 'Soft deletes a task (can be restored later)'
  })
  @ApiParam({
    name: 'id',
    description: 'Task ObjectId',
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Task deleted successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Task not found'
  })
  async remove(
    @Param('id') id: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<void> {
    await this.tasksService.remove(id, teamId, userId);
  }

  @Post(':id/restore')
  @ApiOperation({ 
    summary: 'Restore deleted task',
    description: 'Restores a soft-deleted task back to active state'
  })
  @ApiParam({
    name: 'id',
    description: 'Task ObjectId',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task restored successfully',
    type: TaskResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Deleted task not found'
  })
  async restore(
    @Param('id') id: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.restore(id, teamId, userId);
  }
}