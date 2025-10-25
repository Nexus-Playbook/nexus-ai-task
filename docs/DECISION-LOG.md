# Nexus AI Task Service - Decision Log

## Oct 25, 2025 - Initial Architecture Decisions

### Database Choice: MongoDB
**Decision**: Use MongoDB for task and project storage  
**Rationale**: 
- Document model perfectly fits task structure with flexible schema
- Easy to store nested history array for audit trail
- Labels and custom fields can be added without schema migrations
- Better performance for frequent updates (task status changes)
- Industry standard for agile/kanban tools (Jira, Asana use similar approach)

**Alternative Considered**: PostgreSQL with JSONB  
**Why Not**: More complex queries, overhead of relational joins for simple document retrieval

---

### ORM: Mongoose
**Decision**: Use Mongoose for MongoDB ODM  
**Rationale**:
- Excellent TypeScript support with schemas
- Built-in validation and middleware hooks
- NestJS-friendly with `@nestjs/mongoose` integration
- Automatic index management for performance
- Virtual fields and instance methods for business logic

---

### Status Management
**Decision**: Fixed enum ['todo', 'in_progress', 'done', 'blocked']  
**Rationale**:
- Matches playbook Kanban specification
- Simple and sufficient for MVP
- Can be extended to custom columns per-project in future
- 'blocked' status helps identify bottlenecks for analytics

---

### Priority System
**Decision**: Use priority levels: 1 (Critical) → 5 (Low)  
**Rationale**:
- Numeric for easy sorting in queries
- Clear hierarchy for users
- Standard across PM tools
- Can add color coding in UI (red → gray)

---

### Team Scoping & Authorization
**Decision**: All queries filtered by `team_id` from JWT token  
**Rationale**:
- Multi-tenant security at data layer
- Prevents cross-team data leakage
- Aligns with auth service tenant model
- Each team is isolated data silo

**Role Matrix**:
| Role       | Create Task | Assign Any | Update Any | Delete Any |
|------------|-------------|------------|------------|------------|
| Admin      | ✓           | ✓          | ✓          | ✓          |
| Team Lead  | ✓           | ✓          | ✓          | ✓          |
| Member     | ✓           | Self only  | Own tasks  | Own tasks  |
| Freelancer | ✓           | Self only  | Own tasks  | Own tasks  |

---

### History Tracking
**Decision**: Store change history as embedded array in task document  
**Rationale**:
- Keeps history co-located with task for fast queries
- No need for separate audit service in MVP
- Captures who changed what and when
- Useful for analytics and compliance

**Schema**:
```typescript
history: [{
  action: 'created' | 'updated' | 'assigned' | 'status_changed',
  user_id: UUID,
  timestamp: Date,
  changes: { field: string, oldValue: any, newValue: any }[]
}]
```

---

### API Design
**Decision**: RESTful with team-scoped resources  
**Endpoints**:
- `POST /tasks` - Create (requires project_id or defaults to team backlog)
- `GET /tasks?projectId=&status=&assigneeId=` - List with filters
- `PATCH /tasks/:id` - Partial update
- `DELETE /tasks/:id` - Soft delete (set deleted_at)

**Why REST over GraphQL**: 
- Simpler for MVP
- Better caching with HTTP standards
- Easier integration with frontend state management
- Can add GraphQL layer later if needed

---

### Real-time Strategy (Week 3 prep)
**Decision**: Redis Pub/Sub for task change events  
**Rationale**:
- Low latency for WebSocket broadcast
- Simple setup for MVP scale
- Event shape: `{type: 'task.updated', teamId, taskId, changes}`
- Gateway subscribes to team channels and pushes to connected clients

---

### Validation Strategy
**Decision**: Use class-validator DTOs with NestJS pipes  
**Rationale**:
- Type-safe validation
- Automatic error responses
- OpenAPI documentation generation
- Reusable validation decorators

---

### Error Handling
**Decision**: Custom exception filters for consistent API responses  
**Format**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title is required" }
  ],
  "timestamp": "2025-10-25T03:16:00.000Z"
}
```

---

### Production Considerations
**Decision**: MongoDB Atlas for managed database  
**Rationale**:
- Production-ready with automated backups
- Global replication for low latency
- Free tier sufficient for MVP (512MB storage)
- No DevOps overhead for MVP phase
- Easy scaling path (vertical and horizontal)

**Connection Security**:
- IP whitelist (0.0.0.0/0 for MVP, restrict post-launch)
- Database user with scoped permissions
- TLS/SSL enforced connections

---

### Indexing Strategy
```javascript
// MongoDB indexes for performance
tasks: [
  { team_id: 1, status: 1 },        // Kanban queries
  { team_id: 1, assignee_id: 1 },   // User task lists
  { team_id: 1, project_id: 1 },    // Project views
  { due_date: 1 },                   // Reminder queries
]

projects: [
  { team_id: 1 },                    // Team project list
  { team_id: 1, created_at: -1 }    // Recent projects
]
```

---

### Code Organization
```
src/
├── tasks/
│   ├── dto/              # Request/response DTOs
│   ├── schemas/          # Mongoose schemas
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   ├── tasks.module.ts
│   └── tasks.repository.ts  # DB abstraction layer
├── projects/
│   └── [same structure]
├── common/
│   ├── guards/           # JWT auth guard (shared)
│   ├── decorators/       # @CurrentUser, @TeamId
│   ├── filters/          # Exception filters
│   └── interceptors/     # Logging, transform
└── main.ts
```

---

## Next Steps (Week 3)
- [ ] Add WebSocket gateway for real-time events
- [ ] Integrate Redis Pub/Sub
- [ ] Add task position field for drag-drop ordering
- [ ] Implement optimistic locking for concurrent updates

