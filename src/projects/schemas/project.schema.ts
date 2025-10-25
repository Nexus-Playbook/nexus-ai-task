import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProjectDocument = HydratedDocument<Project>;

export class ProjectSettings {
  @ApiProperty({
    description: 'Custom column names for Kanban board',
    example: ['todo', 'in_progress', 'review', 'done'],
    required: false,
  })
  @Prop({ type: [String], default: ['todo', 'in_progress', 'done', 'blocked'] })
  columns: string[];

  @ApiProperty({
    description: 'Project visibility level',
    enum: ['team', 'public', 'private'],
    default: 'team',
  })
  @Prop({ 
    type: String, 
    enum: ['team', 'public', 'private'], 
    default: 'team' 
  })
  visibility: string;

  @ApiProperty({
    description: 'Hex color for UI theming',
    example: '#3B82F6',
    required: false,
  })
  @Prop({ type: String, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  color?: string;
}

@Schema({ 
  timestamps: true,
  collection: 'projects',
  toJSON: { 
    virtuals: true, 
    transform: (doc, ret) => {
      (ret as any).id = ret._id?.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
})
export class Project {
  @ApiProperty({
    description: 'Project name',
    example: 'Website Redesign',
    maxLength: 100,
  })
  @Prop({ 
    required: true, 
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters'],
    minlength: [1, 'Project name is required']
  })
  name: string;

  @ApiProperty({
    description: 'Detailed project description',
    example: 'Complete redesign of company website with modern UI/UX',
    required: false,
    maxLength: 1000,
  })
  @Prop({ 
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  })
  description?: string;

  @ApiProperty({
    description: 'ID of the team this project belongs to',
    example: 'cmh5jwbxl000fubpcofky8vqy',
  })
  @Prop({ 
    required: true,
    index: true,
    match: /^[a-z0-9]{25}$/
  })
  team_id: string;

  @ApiProperty({
    description: 'ID of the user who created this project',
    example: 'cmh5jwbxl000fubpcofky8vqy',
  })
  @Prop({ 
    required: true,
    match: /^[a-z0-9]{25}$/
  })
  created_by: string;

  @ApiProperty({
    description: 'Project settings and customization',
    type: ProjectSettings,
    required: false,
  })
  @Prop({ type: ProjectSettings })
  settings?: ProjectSettings;

  @ApiProperty({
    description: 'Soft delete timestamp (null if active)',
    required: false,
  })
  @Prop({ default: null, index: true })
  deleted_at?: Date;

  @ApiProperty({
    description: 'Project creation timestamp',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'Project last updated timestamp',
  })
  updated_at?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Compound indexes for performance
ProjectSchema.index({ team_id: 1, name: 1 }, { unique: true }); // Unique name per team
ProjectSchema.index({ team_id: 1, created_at: -1 }); // Recent projects
ProjectSchema.index({ team_id: 1, deleted_at: 1 }); // Active projects filter

// Virtual for task count (populated separately)
ProjectSchema.virtual('task_count', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project_id',
  count: true,
  match: { deleted_at: null }
});

// Pre-save middleware
ProjectSchema.pre('save', function(next) {
  if (this.isNew) {
    this.created_at = new Date();
  }
  this.updated_at = new Date();
  next();
});

// Instance methods
ProjectSchema.methods.toJSON = function() {
  const obj = this.toObject();
  (obj as any).id = obj._id?.toString();
  delete (obj as any)._id;
  delete (obj as any).__v;
  return obj;
};