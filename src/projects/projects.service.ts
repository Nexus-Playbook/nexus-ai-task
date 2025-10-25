import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, teamId: string, userId: string): Promise<any> {
    // Check if project name already exists for this team
    const existingProject = await this.projectModel.findOne({
      name: createProjectDto.name,
      team_id: teamId,
      deleted_at: null,
    });

    if (existingProject) {
      throw new ConflictException('A project with this name already exists in your team');
    }

    const project = new this.projectModel({
      ...createProjectDto,
      team_id: teamId,
      created_by: userId,
    });

    const savedProject = await project.save();
    const projectObj = savedProject.toObject({ virtuals: true });
    return {
      ...projectObj,
      id: projectObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async findAll(teamId: string, includeDeleted = false): Promise<any[]> {
    const filter: any = { team_id: teamId };
    
    if (!includeDeleted) {
      filter.deleted_at = null;
    }

    const projects = await this.projectModel
      .find(filter)
      .sort({ created_at: -1 })
      .populate('task_count')
      .exec();
      
    return projects.map(project => {
      const projectObj = project.toObject({ virtuals: true });
      return {
        ...projectObj,
        id: projectObj._id,
        _id: undefined,
        __v: undefined
      };
    });
  }

  async findOne(id: string, teamId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid project ID format');
    }

    const project = await this.projectModel
      .findOne({
        _id: id,
        team_id: teamId,
        deleted_at: null,
      })
      .populate('task_count')
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found or you do not have access to it');
    }

    const projectObj = project.toObject({ virtuals: true });
    return {
      ...projectObj,
      id: projectObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async update(
    id: string, 
    updateProjectDto: UpdateProjectDto, 
    teamId: string, 
    userId: string
  ): Promise<any> {
    const project = await this.findOne(id, teamId);

    // Check for name conflict if name is being updated
    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existingProject = await this.projectModel.findOne({
        name: updateProjectDto.name,
        team_id: teamId,
        _id: { $ne: id },
        deleted_at: null,
      });

      if (existingProject) {
        throw new ConflictException('A project with this name already exists in your team');
      }
    }

    // Update the project
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateProjectDto,
            updated_at: new Date(),
          },
        },
        { new: true }
      )
      .populate('task_count')
      .exec();

    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }

    const projectObj = updatedProject.toObject({ virtuals: true });
    return {
      ...projectObj,
      id: projectObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async remove(id: string, teamId: string, userId: string): Promise<void> {
    const project = await this.findOne(id, teamId);

    // Soft delete the project
    await this.projectModel.findByIdAndUpdate(id, {
      $set: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async restore(id: string, teamId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid project ID format');
    }

    const project = await this.projectModel.findOne({
      _id: id,
      team_id: teamId,
      deleted_at: { $ne: null },
    });

    if (!project) {
      throw new NotFoundException('Deleted project not found');
    }

    // Check for name conflict before restoring
    const existingProject = await this.projectModel.findOne({
      name: project.name,
      team_id: teamId,
      deleted_at: null,
    });

    if (existingProject) {
      throw new ConflictException(
        'Cannot restore: A project with this name already exists in your team'
      );
    }

    const restoredProject = await this.projectModel
      .findByIdAndUpdate(
        id,
        {
          $unset: { deleted_at: 1 },
          $set: { updated_at: new Date() },
        },
        { new: true }
      )
      .populate('task_count')
      .exec();

    const projectObj = restoredProject!.toObject({ virtuals: true });
    return {
      ...projectObj,
      id: projectObj._id,
      _id: undefined,
      __v: undefined
    };
  }

  async getTeamStats(teamId: string): Promise<{
    total_projects: number;
    active_projects: number;
    deleted_projects: number;
  }> {
    const [total, active, deleted] = await Promise.all([
      this.projectModel.countDocuments({ team_id: teamId }),
      this.projectModel.countDocuments({ team_id: teamId, deleted_at: null }),
      this.projectModel.countDocuments({ team_id: teamId, deleted_at: { $ne: null } }),
    ]);

    return {
      total_projects: total,
      active_projects: active,
      deleted_projects: deleted,
    };
  }
}