import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  LOWEST = 5
}

export class TaskHistoryEntry {
  @ApiProperty({
    description: 'Type of action performed',
    enum: ['created', 'updated', 'assigned', 'status_changed', 'commented'],
  })
  @Prop({ 
    required: true,
    enum: ['created', 'updated', 'assigned', 'status_changed', 'commented']
  })
  action: string;

  @ApiProperty({
    description: 'ID of user who performed the action',
    example: 'cmh5jwbxl000fubpcofky8vqy',
  })
  @Prop({ 
    required: true,
    match: /^[a-z0-9]{25}$/
  })
  user_id: string;

  @ApiProperty({
    description: 'Timestamp of the action',
  })
  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @ApiProperty({
    description: 'Array of field changes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        old_value: { type: 'string' },
        new_value: { type: 'string' }
      }
    },
    example: [{ field: 'status', old_value: 'todo', new_value: 'in_progress' }],
  })
  @Prop([{
    field: { type: String, required: true },
    old_value: { type: MongooseSchema.Types.Mixed },
    new_value: { type: MongooseSchema.Types.Mixed }
  }])
  changes: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
}

@Schema({ 
  timestamps: true,
  collection: 'tasks',
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
export class Task {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    maxLength: 200,
  })
  @Prop({ 
    required: true, 
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters'],
    minlength: [1, 'Task title is required']
  })
  title: string;

  @ApiProperty({
    description: 'Detailed task description',
    example: 'Set up JWT-based authentication system with login/register endpoints',
    required: false,
    maxLength: 5000,
  })
  @Prop({ 
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  })
  description?: string;

  @ApiProperty({
    description: 'Current status of the task',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  @Prop({ 
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
    index: true
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Task priority level (1 = Critical, 5 = Lowest)',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  @Prop({ 
    required: true,
    enum: Object.values(TaskPriority).filter(value => typeof value === 'number'), // Extract numeric values from enum
    default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @ApiProperty({
    description: 'ID of the team this task belongs to',
    example: 'cmh5jwbxl000fubpcofky8vqy',
  })
  @Prop({ 
    required: true,
    index: true,
    match: /^[a-z0-9]{25}$/
  })
  team_id: string;

  @ApiProperty({
    description: 'ObjectId of the project this task belongs to',
    example: '68fc1f3d63f2cc7f649b1d6c',
    required: false,
  })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project',
    index: true
  })
  project_id?: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the assigned user',
    example: 'cmh5jwbxl000fubpcofky8vqy',
    required: false,
  })
  @Prop({ 
    index: true,
    match: /^[a-z0-9]{25}$/
  })
  assignee_id?: string;

  @ApiProperty({
    description: 'ID of the user who created this task',
    example: 'cmh5jwbxl000fubpcofky8vqy',
  })
  @Prop({ 
    required: true,
    match: /^[a-z0-9]{25}$/
  })
  created_by: string;

  @ApiProperty({
    description: 'Array of label strings for categorization',
    example: ['bug', 'frontend', 'urgent'],
    required: false,
  })
  @Prop({ 
    type: [String],
    validate: {
      validator: (labels: string[]) => labels.length <= 50,
      message: 'Maximum 50 labels allowed per task'
    }
  })
  labels?: string[];

  @ApiProperty({
    description: 'Flexible tags for additional filtering',
    required: false,
  })
  @Prop([String])
  tags?: string[];

  @ApiProperty({
    description: 'Task deadline',
    required: false,
  })
  @Prop()
  due_date?: Date;

  @ApiProperty({
    description: 'Task start date',
    required: false,
  })
  @Prop()
  start_date?: Date;

  @ApiProperty({
    description: 'Estimated hours to complete',
    required: false,
  })
  @Prop({ 
    min: [0, 'Estimated hours must be positive'],
    max: [9999, 'Estimated hours cannot exceed 9999']
  })
  estimated_hours?: number;

  @ApiProperty({
    description: 'Position for drag-drop ordering within status column',
    example: 1635724800000,
  })
  @Prop({ 
    required: true,
    default: () => Date.now(),
    index: true
  })
  position: number;

  @ApiProperty({
    description: 'Timestamp when task was completed',
    required: false,
  })
  @Prop()
  completed_at?: Date;

  @ApiProperty({
    description: 'Task history for audit trail',
    type: [TaskHistoryEntry],
    required: false,
  })
  @Prop({ 
    type: [TaskHistoryEntry],
    validate: {
      validator: (history: TaskHistoryEntry[]) => history.length <= 100,
      message: 'Maximum 100 history entries allowed per task'
    }
  })
  history?: TaskHistoryEntry[];

  @ApiProperty({
    description: 'Soft delete timestamp (null if active)',
    required: false,
  })
  @Prop({ default: null, index: true })
  deleted_at?: Date;

  @ApiProperty({
    description: 'Task creation timestamp',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'Task last updated timestamp',
  })
  updated_at?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Compound indexes for common queries
TaskSchema.index({ team_id: 1, status: 1, position: 1 }); // Kanban board ordering
TaskSchema.index({ team_id: 1, project_id: 1 }); // Project task lists
TaskSchema.index({ team_id: 1, assignee_id: 1 }); // User's tasks
TaskSchema.index({ team_id: 1, deleted_at: 1 }); // Active tasks filter
TaskSchema.index({ due_date: 1 }); // Upcoming deadlines
TaskSchema.index({ team_id: 1, labels: 1 }); // Label filtering

// Text search index for title and description
TaskSchema.index({ 
  title: 'text', 
  description: 'text' 
}, {
  weights: { title: 10, description: 5 },
  name: 'task_text_search'
});

// Pre-save middleware to add history entry and handle completion
TaskSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isNew) {
    this.created_at = now;
    // Add creation history entry
    if (!this.history) this.history = [];
    this.history.push({
      action: 'created',
      user_id: this.created_by,
      timestamp: now,
      changes: [{ field: 'status', old_value: null, new_value: this.status }]
    } as TaskHistoryEntry);
  } else {
    // Track status changes
    if (this.isModified('status')) {
      if (this.status === TaskStatus.DONE && !this.completed_at) {
        this.completed_at = now;
      }
    }
  }
  
  this.updated_at = now;
  next();
});

// Instance methods
TaskSchema.methods.addHistoryEntry = function(
  action: string, 
  userId: string, 
  changes: Array<{field: string, old_value: any, new_value: any}>
) {
  if (!this.history) this.history = [];
  
  this.history.push({
    action,
    user_id: userId,
    timestamp: new Date(),
    changes
  });
  
  // Keep only last 100 entries for performance
  if (this.history.length > 100) {
    this.history = this.history.slice(-100);
  }
};

TaskSchema.methods.toJSON = function() {
  const obj = this.toObject();
  (obj as any).id = obj._id?.toString();
  delete (obj as any)._id;
  delete (obj as any).__v;
  return obj;
};