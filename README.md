# Nexus AI Task Service

Task and project management microservice for Nexus AI platform.

## Features
- Task creation, assignment, and tracking
- Project management with Kanban boards
- Real-time task updates
- Task comments and collaboration
- Priority and due date management
- Task history and audit trail
- Team-based task organization

## Tech Stack
- Node.js with NestJS framework
- TypeScript  
- MongoDB for document storage
- Redis for real-time pub/sub
- WebSocket for live updates

## API Endpoints

### Tasks
- `POST /tasks` - Create new task
- `GET /tasks` - List tasks (with filters)
- `GET /tasks/:id` - Get task details
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/comments` - Add comment to task
- `GET /tasks/:id/history` - Get task history

### Projects
- `POST /projects` - Create new project
- `GET /projects` - List team projects
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/tasks` - Get all project tasks

### Kanban
- `GET /projects/:id/board` - Get Kanban board data
- `PATCH /tasks/:id/status` - Update task status (move columns)
- `PATCH /tasks/:id/position` - Update task position in column

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 5+
- Redis 6+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run start:dev
```

Service runs on [http://localhost:3002](http://localhost:3002)

## Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/nexus_ai_tasks
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
AUTH_SERVICE_URL=http://localhost:3001
PORT=3002
```

## Scripts
- `npm run start:dev` - Start development server
- `npm run build` - Build for production  
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## Data Models

### Task Document
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string", 
  "status": "todo|in_progress|done|blocked",
  "assignee_id": "UUID",
  "project_id": "ObjectId",
  "labels": ["string"],
  "priority": "low|medium|high|critical",
  "due_date": "Date",
  "created_at": "Date",
  "updated_at": "Date",
  "team_id": "UUID",
  "history": [
    {
      "action": "string",
      "user_id": "UUID", 
      "timestamp": "Date",
      "changes": "object"
    }
  ]
}
```

### Project Document
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "team_id": "UUID",
  "created_by": "UUID",
  "created_at": "Date",
  "updated_at": "Date",
  "settings": {
    "columns": ["todo", "in_progress", "review", "done"],
    "visibility": "team|public|private"
  }
}
```

## Real-time Events
- `task.created` - New task created
- `task.updated` - Task modified
- `task.assigned` - Task assigned to user
- `task.commented` - New comment added
- `project.created` - New project created
- `project.updated` - Project modified

## Authentication
All endpoints require valid JWT token from auth service. Team-level access control ensures users can only access their team's tasks and projects.

## Performance
- MongoDB indexes on frequently queried fields (team_id, assignee_id, project_id)
- Redis caching for project board data
- Real-time updates via Redis pub/sub with WebSocket

## License
Private - Nexus AI Platform