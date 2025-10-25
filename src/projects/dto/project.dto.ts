import { IsString, IsOptional, IsNotEmpty, MaxLength, IsObject, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProjectSettingsDto {
  @ApiPropertyOptional({
    description: 'Custom column names for Kanban board',
    example: ['todo', 'in_progress', 'review', 'done'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @ApiPropertyOptional({
    description: 'Project visibility level',
    enum: ['team', 'public', 'private'],
    example: 'team',
  })
  @IsOptional()
  @IsEnum(['team', 'public', 'private'])
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Hex color for UI theming',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Website Redesign',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'Project name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed project description',
    example: 'Complete redesign of company website with modern UI/UX',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Project settings and customization',
    type: ProjectSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Project name',
    example: 'Website Redesign - Phase 2',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Project name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed project description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Project settings and customization',
    type: ProjectSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}

export class ProjectResponseDto {
  @ApiProperty({
    description: 'Project ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Website Redesign',
  })
  name: string;

  @ApiProperty({
    description: 'Project description',
    example: 'Complete redesign of company website',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Team ID this project belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  team_id: string;

  @ApiProperty({
    description: 'User ID who created the project',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  created_by: string;

  @ApiProperty({
    description: 'Project settings',
    type: ProjectSettingsDto,
    required: false,
  })
  settings?: ProjectSettingsDto;

  @ApiProperty({
    description: 'Number of tasks in this project',
    example: 15,
    required: false,
  })
  task_count?: number;

  @ApiProperty({
    description: 'Project creation date',
    example: '2025-10-25T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Project last updated date',
    example: '2025-10-25T15:45:00.000Z',
  })
  updated_at: Date;
}