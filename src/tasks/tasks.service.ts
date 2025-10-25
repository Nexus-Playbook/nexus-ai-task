import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto, teamId: string, userId: string): Promise<any> {
    // Validate project ownership if project_id is provided
    if (createTaskDto.project_id) {
      // TODO: Add project ownership validation when ProjectsService is injected
    }

    const task = new this.taskModel({
      ...createTaskDto,
      team_id: teamId,
      created_by: userId,
      position: Date.now(), // Default position for new tasks
    });

    const savedTask = await task.save();
    const taskObj = savedTask.toObject({ virtuals: true });
    return {
      ...taskObj,
      id: taskObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async findAll(teamId: string, query: TaskQueryDto = {}): Promise<any[]> {
    const filter: any = { team_id: teamId };

    // Apply soft delete filter unless explicitly including deleted
    if (!query.include_deleted) {
      filter.deleted_at = null;
    }

    // Apply status filter
    if (query.status) {
      filter.status = query.status;
    } else if (!query.include_completed) {
      filter.status = { $ne: TaskStatus.DONE };
    }

    // Apply other filters
    if (query.project_id) {
      filter.project_id = new Types.ObjectId(query.project_id);
    }

    if (query.assignee_id) {
      filter.assignee_id = query.assignee_id;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.labels) {
      const labels = query.labels.split(',').map(l => l.trim());
      filter.labels = { $in: labels };
    }

    // Text search
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortOptions: any = {};
    
    // Sort by text score if searching, otherwise by position within status
    if (query.search) {
      sortOptions.score = { $meta: 'textScore' };
    } else {
      sortOptions.status = 1;
      sortOptions.position = 1;
    }

    const tasks = await this.taskModel
      .find(filter)
      .sort(sortOptions)
      .exec();
      
    return tasks.map(task => {
      const taskObj = task.toObject({ virtuals: true });
      return {
        ...taskObj,
        id: taskObj._id,
        _id: undefined,
        __v: undefined
      };
    });
  }

  async findOne(id: string, teamId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid task ID format');
    }

    const task = await this.taskModel
      .findOne({
        _id: id,
        team_id: teamId,
        deleted_at: null,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found or you do not have access to it');
    }

    const taskObj = task.toObject({ virtuals: true });
    return {
      ...taskObj,
      id: taskObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    teamId: string,
    userId: string
  ): Promise<any> {
    const task = await this.findOne(id, teamId);

    // Track changes for history
    const changes: Array<{field: string, old_value: any, new_value: any}> = [];

    Object.keys(updateTaskDto).forEach(key => {
      const newValue = (updateTaskDto as any)[key];
      const oldValue = (task as any)[key];
      
      if (newValue !== oldValue && newValue !== undefined) {
        changes.push({
          field: key,
          old_value: oldValue,
          new_value: newValue
        });
      }
    });

    // Determine history action
    let action = 'updated';
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      action = 'status_changed';
    } else if (updateTaskDto.assignee_id && updateTaskDto.assignee_id !== task.assignee_id) {
      action = 'assigned';
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateTaskDto,
            updated_at: new Date(),
            ...(updateTaskDto.status === TaskStatus.DONE && !task.completed_at && {
              completed_at: new Date()
            })
          },
          $push: {
            history: {
              action,
              user_id: userId,
              timestamp: new Date(),
              changes
            }
          }
        },
        { new: true }
      )
      .exec();

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    const taskObj = updatedTask.toObject({ virtuals: true });
    return {
      ...taskObj,
      id: taskObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async remove(id: string, teamId: string, userId: string): Promise<void> {
    const task = await this.findOne(id, teamId);

    // Soft delete the task
    await this.taskModel.findByIdAndUpdate(id, {
      $set: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      $push: {
        history: {
          action: 'deleted',
          user_id: userId,
          timestamp: new Date(),
          changes: [{ field: 'deleted_at', old_value: null, new_value: new Date() }]
        }
      }
    });
  }

  async restore(id: string, teamId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid task ID format');
    }

    const task = await this.taskModel.findOne({
      _id: id,
      team_id: teamId,
      deleted_at: { $ne: null },
    });

    if (!task) {
      throw new NotFoundException('Deleted task not found');
    }

    const restoredTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        {
          $unset: { deleted_at: 1 },
          $set: { updated_at: new Date() },
          $push: {
            history: {
              action: 'restored',
              user_id: userId,
              timestamp: new Date(),
              changes: [{ field: 'deleted_at', old_value: task.deleted_at, new_value: null }]
            }
          }
        },
        { new: true }
      )
      .exec();

    const taskObj = restoredTask!.toObject({ virtuals: true });
    return {
      ...taskObj,
      id: taskObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async getKanbanBoard(teamId: string, projectId?: string): Promise<{
    todo: any[];
    in_progress: any[];
    done: any[];
    blocked: any[];
  }> {
    const filter: any = {
      team_id: teamId,
      deleted_at: null,
    };

    if (projectId) {
      filter.project_id = new Types.ObjectId(projectId);
    }

    const tasks = await this.taskModel
      .find(filter)
      .sort({ position: 1 })
      .exec();

    const transformTask = (task: any) => {
      const taskObj = task.toObject({ virtuals: true });
      return {
        ...taskObj,
        id: taskObj._id,
        _id: undefined,
        __v: undefined
      };
    };

    return {
      todo: tasks.filter(t => t.status === TaskStatus.TODO).map(transformTask),
      in_progress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).map(transformTask),
      done: tasks.filter(t => t.status === TaskStatus.DONE).map(transformTask),
      blocked: tasks.filter(t => t.status === TaskStatus.BLOCKED).map(transformTask),
    };
  }

  async updatePosition(
    id: string,
    newPosition: number,
    teamId: string,
    userId: string
  ): Promise<any> {
    const task = await this.findOne(id, teamId);

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            position: newPosition,
            updated_at: new Date(),
          }
        },
        { new: true }
      )
      .exec();

    const taskObj = updatedTask!.toObject({ virtuals: true });
    return {
      ...taskObj,
      id: taskObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async getTaskStats(teamId: string, projectId?: string): Promise<{
    total: number;
    by_status: Record<TaskStatus, number>;
    by_priority: Record<number, number>;
    overdue: number;
    completed_today: number;
  }> {
    const filter: any = { team_id: teamId, deleted_at: null };
    
    if (projectId) {
      filter.project_id = new Types.ObjectId(projectId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      total,
      byStatus,
      byPriority,
      overdue,
      completedToday
    ] = await Promise.all([
      this.taskModel.countDocuments(filter),
      
      this.taskModel.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      this.taskModel.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      this.taskModel.countDocuments({
        ...filter,
        due_date: { $lt: new Date() },
        status: { $ne: TaskStatus.DONE }
      }),
      
      this.taskModel.countDocuments({
        ...filter,
        completed_at: { $gte: today, $lt: tomorrow }
      })
    ]);

    // Convert aggregation results to objects
    const statusCounts: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.BLOCKED]: 0,
    };

    byStatus.forEach((item: any) => {
      statusCounts[item._id] = item.count;
    });

    const priorityCounts: Record<number, number> = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    byPriority.forEach((item: any) => {
      priorityCounts[item._id] = item.count;
    });

    return {
      total,
      by_status: statusCounts,
      by_priority: priorityCounts,
      overdue,
      completed_today: completedToday,
    };
  }
}