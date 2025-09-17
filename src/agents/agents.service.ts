import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentMessage,
  AgentCompletionOptions,
  AgentCompletionResponse,
  AgentOrchestrationPlan,
  AgentOrchestrationExecution,
  AgentOrchestrationStep,
} from './agent.adapter.interface';
import { AgentTaskService, CreateTaskDto } from './tasks/agent-task.service';
import { PromptService, PromptContext } from './prompt/prompt.service';

export interface SimpleCompletionRequest {
  messages: AgentMessage[];
  provider?: string;
  options?: AgentCompletionOptions;
}

export interface TemplateCompletionRequest {
  templateName: string;
  templateVersion?: string;
  context: PromptContext;
  provider?: string;
  options?: AgentCompletionOptions;
}

export interface MultiStepRequest {
  plan: AgentOrchestrationPlan;
  context: Record<string, unknown>;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly executions = new Map<string, AgentOrchestrationExecution>();

  constructor(
    private readonly taskService: AgentTaskService,
    private readonly promptService: PromptService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Simple completion - execute a single message completion
   */
  async simpleCompletion(
    request: SimpleCompletionRequest,
  ): Promise<AgentCompletionResponse> {
    const createTaskDto: CreateTaskDto = {
      type: 'completion',
      messages: request.messages,
      options: request.options,
      metadata: {
        requestType: 'simple',
        provider: request.provider,
      },
    };

    const result = await this.taskService.createAndExecuteTask(
      createTaskDto,
      request.provider,
    );
    return result.response;
  }

  /**
   * Template-based completion - use a prompt template
   */
  async templateCompletion(
    request: TemplateCompletionRequest,
  ): Promise<AgentCompletionResponse> {
    const messages = this.promptService.createMessagesByVersion(
      request.templateName,
      request.context,
      request.templateVersion,
    );

    const createTaskDto: CreateTaskDto = {
      type: 'completion',
      messages,
      options: request.options,
      metadata: {
        requestType: 'template',
        templateName: request.templateName,
        templateVersion: request.templateVersion,
        provider: request.provider,
      },
    };

    const result = await this.taskService.createAndExecuteTask(
      createTaskDto,
      request.provider,
    );
    return result.response;
  }

  /**
   * Multi-step orchestration - execute a complex multi-step plan
   */
  async executeMultiStep(
    request: MultiStepRequest,
  ): Promise<AgentOrchestrationExecution> {
    const execution: AgentOrchestrationExecution = {
      id: this.generateId(),
      planId: request.plan.id,
      status: 'running',
      context: { ...request.context },
      results: {},
      errors: {},
      startedAt: new Date(),
    };

    this.executions.set(execution.id, execution);
    this.logger.log(
      `Starting multi-step execution ${execution.id} for plan ${request.plan.id}`,
    );

    try {
      await this.executePlan(request.plan, execution);
      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Multi-step execution ${execution.id} failed: ${errorMessage}`,
      );
      throw error;
    }

    return execution;
  }

  /**
   * Get execution status
   */
  getExecution(id: string): AgentOrchestrationExecution {
    const execution = this.executions.get(id);
    if (!execution) {
      throw new NotFoundException(`Execution '${id}' not found`);
    }
    return execution;
  }

  /**
   * Get all executions
   */
  getAllExecutions(): AgentOrchestrationExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Code analysis - analyze code using AI
   */
  async analyzeCode(
    code: string,
    language: string,
    analysisType: string = 'quality, best practices, potential issues, suggestions',
    provider?: string,
  ): Promise<AgentCompletionResponse> {
    return this.templateCompletion({
      templateName: 'code-review',
      context: { code, language, analysisType },
      provider,
    });
  }

  /**
   * Text analysis - analyze text content
   */
  async analyzeText(
    text: string,
    analysisType: string = 'sentiment, tone, key points, summary',
    provider?: string,
  ): Promise<AgentCompletionResponse> {
    return this.templateCompletion({
      templateName: 'text-analysis',
      context: { text, analysisType },
      provider,
    });
  }

  /**
   * Task breakdown - break down complex tasks into steps
   */
  async breakdownTask(
    task: string,
    context: string = '',
    provider?: string,
  ): Promise<AgentCompletionResponse> {
    return this.templateCompletion({
      templateName: 'multi-step-task',
      context: { task, context },
      provider,
    });
  }

  /**
   * Chat completion - simple chat interaction
   */
  async chat(
    userInput: string,
    provider?: string,
    options?: AgentCompletionOptions,
  ): Promise<AgentCompletionResponse> {
    return this.templateCompletion({
      templateName: 'simple-chat',
      context: { userInput },
      provider,
      options,
    });
  }

  /**
   * Get service statistics
   */
  async getStatistics(): Promise<{
    tasks: Awaited<ReturnType<AgentTaskService['getStatistics']>>;
    executions: {
      total: number;
      byStatus: Record<string, number>;
    };
  }> {
    const taskStats = await this.taskService.getStatistics();

    const executions = Array.from(this.executions.values());
    const executionsByStatus = executions.reduce(
      (acc, exec) => {
        acc[exec.status] = (acc[exec.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      tasks: taskStats,
      executions: {
        total: executions.length,
        byStatus: executionsByStatus,
      },
    };
  }

  /**
   * Validate all adapters
   */
  async validateAdapters(): Promise<Record<string, boolean>> {
    return this.taskService.validateAdapters();
  }

  private async executePlan(
    plan: AgentOrchestrationPlan,
    execution: AgentOrchestrationExecution,
  ): Promise<void> {
    // Create a dependency graph and process steps
    const completed = new Set<string>();

    while (completed.size < plan.steps.length) {
      // Find steps that can be executed (all dependencies completed)
      const readySteps = plan.steps.filter(
        (step) =>
          !completed.has(step.id) &&
          (step.dependsOn || []).every((dep) => completed.has(dep)),
      );

      if (readySteps.length === 0) {
        throw new Error(
          'Circular dependency detected or unresolvable dependencies',
        );
      }

      // Execute ready steps in parallel
      await Promise.all(
        readySteps.map((step) => this.executeStep(step, execution, plan)),
      );

      // Mark steps as completed
      readySteps.forEach((step) => completed.add(step.id));
    }
  }

  private async executeStep(
    step: AgentOrchestrationStep,
    execution: AgentOrchestrationExecution,
    plan: AgentOrchestrationPlan,
  ): Promise<void> {
    this.logger.debug(`Executing step ${step.id}: ${step.name}`);

    try {
      // Check condition if present
      if (step.condition && !step.condition(execution.context)) {
        this.logger.debug(`Skipping step ${step.id} due to condition`);
        return;
      }

      // Transform input if transform function is provided
      let messages: AgentMessage[];
      if (step.transform) {
        messages = step.transform(execution.context, execution.context);
      } else {
        // Default: use the prompt as user message
        messages = [{ role: 'user', content: step.prompt }];
      }

      // Execute the step
      const createTaskDto: CreateTaskDto = {
        type: 'completion',
        messages,
        metadata: {
          executionId: execution.id,
          planId: plan.id,
          stepId: step.id,
          stepName: step.name,
        },
      };

      const result = await this.taskService.createAndExecuteTask(
        createTaskDto,
        step.adapter,
      );

      // Store the result
      execution.results[step.id] = result.response;

      // Update context with the result
      execution.context[`${step.id}_result`] = result.response.content;
      execution.context[`${step.id}_response`] = result.response;

      this.logger.debug(`Step ${step.id} completed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      execution.errors[step.id] = errorMessage;
      this.logger.error(`Step ${step.id} failed: ${errorMessage}`);

      // Determine if we should continue or fail the entire execution
      const maxRetries = plan.maxRetries || 0;
      if (maxRetries > 0) {
        // TODO: Implement retry logic
      }

      throw error;
    }
  }

  private buildDependencyGraph(
    steps: AgentOrchestrationStep[],
  ): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    steps.forEach((step) => {
      graph.set(step.id, new Set(step.dependsOn || []));
    });

    return graph;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
