# Database Schemas - Nexus AI Task Service

## Overview
This document defines the MongoDB collection schemas for the task service. All schemas use Mongoose for TypeScript type safety and validation.

---

## Collections

### 1. Projects Collection

**Purpose**: Organize tasks into projects/boards with team-level scoping.

```typescript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  name: string,                      // Project name (required, max 100 chars)
  description: string,               // Optional project description
  team_id: string,                   // UUID from auth service (indexed)
  created_by: string,                // UUID of user who created project
  created_at: Date,                  // Auto-generated timestamp
  updated_at: Date,                  // Auto-updated timestamp
  
  // Optional settings for customization
  settings: {
    columns: string[],               // Custom column names, default: ['todo', 'in_progress', 'done', 'blocked']
    visibility: string,              // 'team' | 'public' | 'private'
    color: string,                   // Hex color for UI theming
  },
  
  // Soft delete support
  deleted_at: Date | null,           // Null if active, Date if deleted
}
```

**Indexes**:
```javascript
{ team_id: 1 }                       // Primary access pattern
{ team_id: 1, created_at: -1 }       // Recent projects
{ team_id: 1, deleted_at: 1 }        // Filter deleted projects
```

**Constraints**:
- `name` must be unique per team (compound index)
- `team_id` is immutable after creation
- Maximum 50 projects per team (free tier)

---

### 2. Tasks Collection

**Purpose**: Store individual tasks with status, assignments, and history.

```typescript
{
  _id: ObjectId,                     // Auto-generated MongoDB ID
  title: string,                     // Task title (required, max 200 chars)
  description: string,               // Rich text description (optional, max 5000 chars)
  
  // Core fields
  status: string,                    // enum: 'todo' | 'in_progress' | 'done' | 'blocked'
  priority: number,                  // 1 (Critical) to 5 (Low)
  
  // Relationships
  team_id: string,                   // UUID from auth service (indexed)
  project_id: ObjectId | null,       // Reference to projects collection (indexed)
  assignee_id: string | null,        // UUID of assigned user (indexed)
  created_by: string,                // UUID of creator
  
  // Organization
  labels: string[],                  // Array of label names ['bug', 'feature', 'urgent']
  tags: string[],                    // Flexible tags for filtering
  
  // Scheduling
  due_date: Date | null,             // Optional deadline (indexed)
  start_date: Date | null,           // Optional start date
  estimated_hours: number | null,    // Time estimate
  
  // Position for drag-drop ordering within column
  position: number,                  // Float for flexible reordering (default: Date.now())
  
  // Metadata
  created_at: Date,                  // Auto-generated
  updated_at: Date,                  // Auto-updated
  completed_at: Date | null,         // Timestamp when status changed to 'done'
  
  // Audit trail (embedded sub-documents)
  history: [
    {
      action: string,                // 'created' | 'updated' | 'assigned' | 'status_changed' | 'commented'
      user_id: string,               // UUID of user who made change
      timestamp: Date,               // When the change occurred
      changes: [                     // Array of field changes
        {
          field: string,             // Field name that changed
          old_value: any,            // Previous value
          new_value: any,            // New value
        }
      ]
    }
  ],
  
  // Soft delete
  deleted_at: Date | null,
}
```

**Indexes**:
```javascript
// Primary queries
{ team_id: 1, status: 1 }                    // Kanban board view
{ team_id: 1, project_id: 1 }                // Project task list
{ team_id: 1, assignee_id: 1 }               // User's tasks
{ team_id: 1, status: 1, position: 1 }       // Ordered kanban columns

// Secondary queries
{ due_date: 1 }                               // Upcoming deadlines (for notifications)
{ team_id: 1, labels: 1 }                    // Filter by labels
{ team_id: 1, deleted_at: 1 }                // Exclude deleted tasks
{ created_at: -1 }                            // Recent tasks for analytics

// Text search (optional for future)
{ title: 'text', description: 'text' }       // Full-text search
```

**Constraints**:
- `title` is required and non-empty
- `status` must be one of the enum values
- `priority` must be integer 1-5
- `position` default is `Date.now()` to avoid collisions
- Maximum 1000 tasks per project (free tier)

---

### 3. Comments Collection (Week 4 - Deferred for MVP simplicity)

**Note**: For Week 2 MVP, comments can be embedded in task document or deferred. Below is the schema for future implementation.

```typescript
{
  _id: ObjectId,
  task_id: ObjectId,                 // Reference to tasks collection
  team_id: string,                   // For access control
  user_id: string,                   // Comment author
  content: string,                   // Comment text (max 2000 chars)
  created_at: Date,
  updated_at: Date,
  deleted_at: Date | null,
  
  // Optional: Mentions and attachments
  mentions: string[],                // Array of user IDs mentioned
  attachments: [
    {
      filename: string,
      url: string,
      size: number,
    }
  ]
}
```

---

## Validation Rules

### Task Validation
```typescript
class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsEnum(['todo', 'in_progress', 'done', 'blocked'])
  @IsOptional()
  status?: string = 'todo';

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number = 3;

  @IsMongoId()
  @IsOptional()
  project_id?: string;

  @IsUUID()
  @IsOptional()
  assignee_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsDate()
  @IsOptional()
  due_date?: Date;
}
```

### Project Validation
```typescript
class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsObject()
  @IsOptional()
  settings?: {
    columns?: string[];
    visibility?: 'team' | 'public' | 'private';
    color?: string;
  };
}
```

---

## Query Patterns

### Common Queries

**Get team's Kanban board**:
```javascript
const tasks = await taskModel.find({
  team_id: teamId,
  project_id: projectId,
  deleted_at: null
})
.sort({ position: 1 })
.populate('assignee_id', 'name email avatar');
```

**Get user's assigned tasks**:
```javascript
const myTasks = await taskModel.find({
  team_id: teamId,
  assignee_id: userId,
  status: { $ne: 'done' },
  deleted_at: null
})
.sort({ due_date: 1, priority: 1 });
```

**Update task status (with history)**:
```javascript
const result = await taskModel.findByIdAndUpdate(
  taskId,
  {
    $set: { 
      status: newStatus,
      updated_at: new Date(),
      ...(newStatus === 'done' && { completed_at: new Date() })
    },
    $push: {
      history: {
        action: 'status_changed',
        user_id: userId,
        timestamp: new Date(),
        changes: [{ field: 'status', old_value: oldStatus, new_value: newStatus }]
      }
    }
  },
  { new: true }
);
```

---

## Migration Strategy

### Phase 1 (Week 2 - Current)
- Create projects and tasks collections
- Add basic indexes
- Implement CRUD operations

### Phase 2 (Week 3)
- Add position field for ordering
- Implement soft delete queries
- Optimize indexes based on query patterns

### Phase 3 (Week 4+)
- Add comments as separate collection
- Implement full-text search indexes
- Add archival strategy for old tasks (move to cold storage after 1 year)

---

## Data Retention Policy

**Active Tasks**: Kept indefinitely  
**Completed Tasks**: Auto-archive after 90 days (free tier), 1 year (paid)  
**Deleted Tasks**: Soft delete for 30 days, then hard delete  
**History Array**: Trim to last 50 entries for performance (store full history in audit logs)

---

## Security Considerations

1. **Row-Level Security**: All queries MUST include `team_id` filter
2. **Input Sanitization**: Description and comments sanitized to prevent XSS
3. **Rate Limiting**: Max 100 task creates per team per hour
4. **Size Limits**: 
   - Max 50 labels per task
   - Max 100 history entries per task
   - Max 5MB total document size

---

## Performance Targets

- Task list query (100 tasks): < 50ms
- Task creation: < 100ms
- Task update with history: < 150ms
- Kanban board load: < 200ms (with 500 tasks)

---

## Monitoring Queries

Track these metrics in analytics:
- Average tasks per project
- Status distribution per team
- Average time in each status (lead time)
- Tasks overdue (due_date < now && status != 'done')
- High priority blocked tasks (bottleneck detection)

