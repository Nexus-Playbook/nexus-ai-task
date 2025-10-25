# Nexus AI Task Service

Enterprise-grade task and project management microservice for the Nexus AI platform. Built with NestJS and MongoDB, featuring Kanban boards, advanced filtering, and team collaboration.

## ✅ Week 2 Status: COMPLETE

**Current Implementation:**
- ✅ Complete CRUD operations for projects and tasks
- ✅ Kanban board with position management
- ✅ Advanced filtering, search, and analytics
- ✅ Team-scoped multi-tenancy with JWT authentication
- ✅ Audit trails and task history tracking
- ✅ Rate limiting and comprehensive validation
- ✅ OpenAPI/Swagger documentation
- ✅ Production-ready MongoDB integration

## Tech Stack
- **Framework:** NestJS (TypeScript)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens from nexus-ai-auth service
- **Documentation:** OpenAPI/Swagger
- **Validation:** class-validator with custom DTOs
- **Performance:** Rate limiting, MongoDB indexing
- **Future:** Redis for real-time features, WebSocket for live updates

## API Documentation

**Interactive docs:** `http://localhost:3002/api/docs` (Swagger UI)

### Core Endpoints (Week 2 Complete)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Projects** | | |
| POST | `/projects` | Create new project |
| GET | `/projects` | List team projects (supports pagination) |
| GET | `/projects/:id` | Get project details |
| PATCH | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Soft delete project |
| POST | `/projects/:id/restore` | Restore deleted project |
| GET | `/projects/stats` | Project statistics & analytics |
| **Tasks** | | |
| POST | `/tasks` | Create new task |
| GET | `/tasks` | List tasks with advanced filtering |
| GET | `/tasks/kanban` | Get Kanban board view |
| GET | `/tasks/:id` | Get task details with history |
| PATCH | `/tasks/:id` | Update task |
| PATCH | `/tasks/:id/position` | Update task position (drag & drop) |
| DELETE | `/tasks/:id` | Soft delete task |
| POST | `/tasks/:id/restore` | Restore deleted task |
| GET | `/tasks/stats` | Task analytics & distribution |
| **Health** | | |
| GET | `/health` | Service health check |
| GET | `/health/ready` | Kubernetes readiness probe |

### Advanced Filtering (Tasks)
```bash
# Text search across title and description
GET /tasks?search=authentication

# Multi-criteria filtering
GET /tasks?project_id=123&status=todo&priority=1&labels=urgent,backend

# User assignments
GET /tasks?assignee_id=user-uuid

# Include soft-deleted items
GET /tasks?include_completed=true
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- nexus-ai-auth service running (JWT validation)

### Installation & Setup
```bash
# Install dependencies
npm install

# Configure environment (copy from .env.example)
# Update MONGODB_URI and JWT_SECRET

# Start development server
npm run start:dev
```

**Service URL:** `http://localhost:3002`  
**API Docs:** `http://localhost:3002/api/docs`

## Configuration

Current environment variables (.env):
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/nexus_ai_tasks

# Authentication (must match auth service)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=3002

# External Services
AUTH_SERVICE_URL=http://localhost:3001

# Optional Features
CORS_ORIGIN=http://localhost:3000
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

## Scripts
- `npm run start:dev` - Start development server
- `npm run build` - Build for production  
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## Data Models (MongoDB Schemas)

### Project Schema
```typescript
{
  _id: ObjectId;               // MongoDB document ID
  id: string;                  // Computed field (API responses)
  name: string;                // Project name (max 100 chars)
  description?: string;        // Optional description
  team_id: string;            // Team ownership (UUID)
  created_by: string;         // Creator user ID (UUID)
  created_at: Date;           // Creation timestamp
  updated_at: Date;           // Last modified timestamp
  settings?: {                // Custom project settings
    columns: string[];        // Custom Kanban column names
    visibility: 'team' | 'public' | 'private';
    color: string;            // Hex color for UI theming
  };
  deleted_at?: Date;          // Soft delete timestamp
}
```

### Task Schema
```typescript
{
  _id: ObjectId;                    // MongoDB document ID
  id: string;                       // Computed field (API responses)
  title: string;                    // Task title (max 200 chars)
  description?: string;             // Rich text description
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 1 | 2 | 3 | 4 | 5;     // 1=Critical, 5=Lowest
  team_id: string;                 // Team ownership (UUID)
  project_id?: ObjectId;           // Parent project (optional)
  assignee_id?: string;            // Assigned user (UUID)
  created_by: string;              // Creator (UUID)
  created_at: Date;                // Creation timestamp
  updated_at: Date;                // Last modified timestamp
  labels?: string[];               // Categorization tags
  due_date?: Date;                 // Task deadline
  estimated_hours?: number;        // Time estimate
  position: number;                // Drag-drop ordering (timestamp-based)
  completed_at?: Date;             // Task completion timestamp
  deleted_at?: Date;               // Soft delete timestamp
  history: Array<{                 // Complete audit trail
    action: string;                // Action type (created, updated, assigned, etc.)
    user_id: string;               // User who performed action
    timestamp: Date;               // When action occurred
    changes: Array<{               // Field-level change tracking
      field: string;               // Changed field name
      old_value: any;              // Previous value
      new_value: any;              // New value
    }>;
  }>;
}
```

## Security & Performance

**Security (Week 2 Complete):**
- JWT-based authentication with team scoping
- All database queries automatically filtered by `team_id`
- Input validation using NestJS pipes and class-validator
- Rate limiting: 100 requests per minute per IP
- Soft deletes with restore functionality
- CORS protection for browser security

**Performance Optimizations:**
- Strategic MongoDB compound indexes:
  - `{team_id: 1, status: 1, position: 1}` - Kanban board queries
  - `{team_id: 1, project_id: 1}` - Project-filtered task views
  - `{team_id: 1, assignee_id: 1}` - User dashboard queries
  - `{title: 'text', description: 'text'}` - Full-text search
- Efficient aggregation pipelines for analytics
- Pagination support for large datasets
- MongoDB connection pooling and automatic retry logic

## Testing

**Available Resources:**
- Comprehensive API testing guide: [`API-TESTING-GUIDE.md`](./API-TESTING-GUIDE.md)
- PowerShell scripts for all endpoint testing
- Example request/response payloads
- Error scenario validations

**Test Coverage:**
- All CRUD operations (projects & tasks)
- Kanban board functionality
- Advanced filtering and search
- Authentication and authorization
- Analytics and statistics endpoints

## Architecture

**Current Implementation (Week 2):**
- Clean domain-driven structure (`/projects`, `/tasks`, `/common`)
- Dependency injection with NestJS modules
- Controller → Service → Repository pattern
- MongoDB with Mongoose ODM for flexible document storage
- Comprehensive validation and error handling
- Health checks for monitoring and deployment

**Future Enhancements (Week 3+):**
- Real-time WebSocket connections for live Kanban updates
- Redis pub/sub for multi-user collaboration
- Event-driven architecture for microservice communication
- Advanced caching strategies for high-performance operations

## Week 3 Roadmap
- [ ] WebSocket gateway for real-time Kanban updates
- [ ] Redis integration for pub/sub messaging
- [ ] Optimistic concurrency control for collaborative editing
- [ ] Real-time notifications for task assignments and updates

## License
Private - Nexus AI Platform

---

**🎉 Week 2 Complete! Ready for real-time features in Week 3.**