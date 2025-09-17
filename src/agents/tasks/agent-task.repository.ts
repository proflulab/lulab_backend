import { Injectable, Logger } from '@nestjs/common';
import { AgentTask } from '../agent.adapter.interface';

@Injectable()
export class AgentTaskRepository {
  private readonly logger = new Logger(AgentTaskRepository.name);
  private readonly tasks = new Map<string, AgentTask>();

  /**
   * Create a new agent task
   */
  create(task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt'>): AgentTask {
    const newTask: AgentTask = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(newTask.id, newTask);
    this.logger.debug(`Created task ${newTask.id} with type ${newTask.type}`);

    return newTask;
  }

  /**
   * Find a task by ID
   */
  findById(id: string): AgentTask | null {
    return this.tasks.get(id) || null;
  }

  /**
   * Find tasks by status
   */
  findByStatus(status: AgentTask['status']): AgentTask[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === status,
    );
  }

  /**
   * Find tasks by type
   */
  findByType(type: AgentTask['type']): AgentTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.type === type);
  }

  /**
   * Update a task
   */
  update(
    id: string,
    updates: Partial<Omit<AgentTask, 'id' | 'createdAt'>>,
  ): AgentTask | null {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }

    const updatedTask: AgentTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.status === 'completed' && !updatedTask.completedAt) {
      updatedTask.completedAt = new Date();
    }

    this.tasks.set(id, updatedTask);
    this.logger.debug(`Updated task ${id}`);

    return updatedTask;
  }

  /**
   * Delete a task
   */
  delete(id: string): boolean {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.logger.debug(`Deleted task ${id}`);
    }
    return deleted;
  }

  /**
   * Get all tasks
   */
  findAll(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<AgentTask['status'], number>;
    byType: Record<AgentTask['type'], number>;
  } {
    const allTasks = Array.from(this.tasks.values());

    const byStatus: Record<AgentTask['status'], number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    const byType: Record<AgentTask['type'], number> = {
      completion: 0,
      analysis: 0,
      generation: 0,
      classification: 0,
    };

    allTasks.forEach((task) => {
      byStatus[task.status]++;
      byType[task.type]++;
    });

    return {
      total: allTasks.length,
      byStatus,
      byType,
    };
  }

  /**
   * Clean up completed tasks older than specified hours
   */
  cleanup(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        task.updatedAt < cutoffTime
      ) {
        this.tasks.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old tasks`);
    }

    return cleanedCount;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
