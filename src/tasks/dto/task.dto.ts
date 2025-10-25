import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  MaxLength, 
  IsEnum, 
  IsInt, 
  Min, 
  Max, 
  IsArray, 
  IsMongoId, 
  IsUUID, 
  IsDate,
  IsNumber,
  Matches
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200, { message: 'Task title cannot exceed 200 characters' })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed task description',
    example: 'Set up JWT-based authentication system with login/register endpoints',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Task priority (1 = Critical, 5 = Lowest)',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Project ID this task belongs to',
    example: '68fc1f3d63f2cc7f649b1d6c',
  })
  @IsOptional()
  @IsMongoId()
  project_id?: string;

  @ApiPropertyOptional({
    description: 'User ID to assign this task to',
    example: 'cmh5jwbxl000fubpcofky8vqy',
  })
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @ApiPropertyOptional({
    description: 'Array of labels for categorization',
    example: ['bug', 'frontend', 'urgent'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({
    description: 'Array of tags for additional filtering',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Task deadline',
    example: '2025-11-01T23:59:59.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  due_date?: Date;

  @ApiPropertyOptional({
    description: 'Task start date',
    example: '2025-10-25T09:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @ApiPropertyOptional({
    description: 'Estimated hours to complete',
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Estimated hours must be positive' })
  @Max(9999, { message: 'Estimated hours cannot exceed 9999' })
  estimated_hours?: number;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Task title',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Task title cannot exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Task description',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Project ID',
  })
  @IsOptional()
  @IsMongoId()
  project_id?: string;

  @ApiPropertyOptional({
    description: 'Assignee user ID',
  })
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @ApiPropertyOptional({
    description: 'Task labels',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({
    description: 'Task tags',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Due date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  due_date?: Date;

  @ApiPropertyOptional({
    description: 'Start date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @ApiPropertyOptional({
    description: 'Estimated hours',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  estimated_hours?: number;

  @ApiPropertyOptional({
    description: 'Position for drag-drop reordering',
    example: 1635724800000,
  })
  @IsOptional()
  @IsNumber()
  position?: number;
}

export class TaskQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by project ID',
  })
  @IsOptional()
  @IsMongoId()
  project_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by task status',
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filter by assignee ID',
  })
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Filter by labels (comma-separated)',
    example: 'bug,urgent',
  })
  @IsOptional()
  @IsString()
  labels?: string;

  @ApiPropertyOptional({
    description: 'Search in title and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Include completed tasks',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_completed?: boolean;

  @ApiPropertyOptional({
    description: 'Include deleted tasks (admin only)',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_deleted?: boolean;
}

export class TaskResponseDto {
  @ApiProperty({
    description: 'Task ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
  })
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Set up JWT-based authentication system',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ApiProperty({
    description: 'Team ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  team_id: string;

  @ApiProperty({
    description: 'Project ID',
    required: false,
  })
  project_id?: string;

  @ApiProperty({
    description: 'Assignee user ID',
    required: false,
  })
  assignee_id?: string;

  @ApiProperty({
    description: 'Created by user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  created_by: string;

  @ApiProperty({
    description: 'Task labels',
    example: ['bug', 'frontend'],
    required: false,
  })
  labels?: string[];

  @ApiProperty({
    description: 'Task tags',
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: 'Due date',
    required: false,
  })
  due_date?: Date;

  @ApiProperty({
    description: 'Start date',
    required: false,
  })
  start_date?: Date;

  @ApiProperty({
    description: 'Estimated hours',
    required: false,
  })
  estimated_hours?: number;

  @ApiProperty({
    description: 'Position for ordering',
    example: 1635724800000,
  })
  position: number;

  @ApiProperty({
    description: 'Completion timestamp',
    required: false,
  })
  completed_at?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updated_at: Date;
}