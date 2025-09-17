import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentTask,
  AgentMessage,
  AgentCompletionOptions,
  AgentCompletionResponse,
  AgentAdapter,
} from '../agent.adapter.interface';
import { AgentTaskRepository } from './agent-task.repository';

export interface CreateTaskDto {
  type: AgentTask['type'];
  messages: AgentMessage[];
  options?: AgentCompletionOptions;
  metadata?: Record<string, unknown>;
}

export interface TaskExecutionResult {
  task: AgentTask;
  response: AgentCompletionResponse;
}

@Injectable()
export class AgentTaskService {
  private readonly logger = new Logger(AgentTaskService.name);
  private readonly adapters = new Map<string, AgentAdapter>();

  constructor(
    private readonly taskRepository: AgentTaskRepository,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Register an agent adapter
   */
  registerAdapter(adapter: AgentAdapter): void {
    this.adapters.set(adapter.provider, adapter);
    this.logger.log(`Registered adapter: ${adapter.provider}`);
  }

  /**
   * Get available adapters
   */
  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get adapter by provider name
   */
  getAdapter(provider: string): AgentAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new NotFoundException(`Adapter '${provider}' not found`);
    }
    return adapter;
  }

  /**
   * Create a new task
   */
  createTask(dto: CreateTaskDto): AgentTask {
    const task = this.taskRepository.create({
      type: dto.type,
      status: 'pending',
      input: {
        messages: dto.messages,
        options: dto.options,
      },
      metadata: dto.metadata,
    });

    this.logger.debug(`Created task ${task.id} of type ${task.type}`);
    return task;
  }

  /**
   * Execute a task with a specific adapter
   */
  async executeTask(
    taskId: string,
    provider: string,
  ): Promise<TaskExecutionResult> {
    const task = this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    if (task.status !== 'pending') {
      throw new BadRequestException(
        `Task '${taskId}' is not in pending status`,
      );
    }

    const adapter = this.getAdapter(provider);
    if (!adapter.isConfigured()) {
      throw new BadRequestException(
        `Adapter '${provider}' is not properly configured`,
      );
    }

    this.taskRepository.update(taskId, { status: 'running' });

    try {
      this.logger.debug(`Executing task ${taskId} with adapter ${provider}`);

      const response = await adapter.complete(
        task.input.messages,
        task.input.options,
      );

      const updatedTask = this.taskRepository.update(taskId, {
        status: 'completed',
        output: response,
      });

      this.logger.debug(`Task ${taskId} completed successfully`);

      return {
        task: updatedTask!,
        response,
      };
    } catch (error) {
      // Update task with error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.taskRepository.update(taskId, {
        status: 'failed',
        error: errorMessage,
      });

      this.logger.error(`Task ${taskId} failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Execute a task and automatically select the best available adapter
   */
  async executeTaskAuto(taskId: string): Promise<TaskExecutionResult> {
    const defaultProvider = this.configService.get<string>(
      'AGENT_DEFAULT_PROVIDER',
      'local',
    );
    const availableAdapters = this.getAvailableAdapters();

    if (!availableAdapters.includes(defaultProvider)) {
      if (availableAdapters.length === 0) {
        throw new BadRequestException('No adapters available');
      }
      // Use the first available adapter
      return this.executeTask(taskId, availableAdapters[0]);
    }

    return this.executeTask(taskId, defaultProvider);
  }

  /**
   * Create and execute a task in one step
   */
  async createAndExecuteTask(
    dto: CreateTaskDto,
    provider?: string,
  ): Promise<TaskExecutionResult> {
    const task = this.createTask(dto);

    if (provider) {
      return this.executeTask(task.id, provider);
    } else {
      return this.executeTaskAuto(task.id);
    }
  }

  /**
   * Get task by ID
   */
  getTask(id: string): AgentTask {
    const task = this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task '${id}' not found`);
    }
    return task;
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: AgentTask['status']): AgentTask[] {
    return this.taskRepository.findByStatus(status);
  }

  /**
   * Get tasks by type
   */
  getTasksByType(type: AgentTask['type']): AgentTask[] {
    return this.taskRepository.findByType(type);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): AgentTask[] {
    return this.taskRepository.findAll();
  }

  /**
   * Get task statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<AgentTask['status'], number>;
    byType: Record<AgentTask['type'], number>;
    adapters: {
      name: string;
      configured: boolean;
      available: boolean;
    }[];
  }> {
    const taskStats = this.taskRepository.getStatistics();

    const adapterStats = await Promise.all(
      Array.from(this.adapters.entries()).map(async ([name, adapter]) => ({
        name,
        configured: adapter.isConfigured(),
        available: adapter.isConfigured()
          ? await adapter.validateConfig()
          : false,
      })),
    );

    return {
      ...taskStats,
      adapters: adapterStats,
    };
  }

  /**
   * Cancel a pending task
   */
  cancelTask(id: string): AgentTask {
    const task = this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task '${id}' not found`);
    }

    if (task.status !== 'pending') {
      throw new BadRequestException(
        `Cannot cancel task '${id}' - it is not pending`,
      );
    }

    const updatedTask = this.taskRepository.update(id, {
      status: 'failed',
      error: 'Cancelled by user',
    });

    this.logger.debug(`Cancelled task ${id}`);
    return updatedTask!;
  }

  /**
   * Retry a failed task
   */
  async retryTask(id: string, provider?: string): Promise<TaskExecutionResult> {
    const task = this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task '${id}' not found`);
    }

    if (task.status !== 'failed') {
      throw new BadRequestException(
        `Cannot retry task '${id}' - it has not failed`,
      );
    }

    this.taskRepository.update(id, {
      status: 'pending',
      error: undefined,
      output: undefined,
    });

    // Execute the task
    if (provider) {
      return this.executeTask(id, provider);
    } else {
      return this.executeTaskAuto(id);
    }
  }

  /**
   * Clean up old completed/failed tasks
   */
  cleanupTasks(olderThanHours: number = 24): number {
    return this.taskRepository.cleanup(olderThanHours);
  }

  /**
   * Validate adapter configurations
   */
  async validateAdapters(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, adapter] of this.adapters.entries()) {
      try {
        results[name] =
          adapter.isConfigured() && (await adapter.validateConfig());
      } catch (error) {
        this.logger.warn(`Adapter '${name}' validation failed:`, error);
        results[name] = false;
      }
    }

    return results;
  }
}
