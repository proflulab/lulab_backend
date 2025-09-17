import { Module } from '@nestjs/common';

// Core services
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { PromptService } from './prompt/prompt.service';
import { AgentTaskService } from './tasks/agent-task.service';
import { AgentTaskRepository } from './tasks/agent-task.repository';

// Adapters
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { DeepSeekAdapter } from './adapters/deepseek.adapter';
import { LocalAdapter } from './adapters/local.adapter';

@Module({
  controllers: [AgentsController],
  providers: [
    // Core services
    AgentsService,
    PromptService,
    AgentTaskService,
    AgentTaskRepository,

    // Adapters
    OpenAIAdapter,
    AnthropicAdapter,
    DeepSeekAdapter,
    LocalAdapter,
  ],
  exports: [
    AgentsService,
    PromptService,
    AgentTaskService,
    AgentTaskRepository,
  ],
})
export class AgentsModule {
  constructor(
    private readonly agentTaskService: AgentTaskService,
    private readonly openAIAdapter: OpenAIAdapter,
    private readonly anthropicAdapter: AnthropicAdapter,
    private readonly deepSeekAdapter: DeepSeekAdapter,
    private readonly localAdapter: LocalAdapter,
  ) {
    // Register all adapters on module initialization
    this.registerAdapters();
  }

  private registerAdapters(): void {
    // Register all available adapters
    this.agentTaskService.registerAdapter(this.openAIAdapter);
    this.agentTaskService.registerAdapter(this.anthropicAdapter);
    this.agentTaskService.registerAdapter(this.deepSeekAdapter);
    this.agentTaskService.registerAdapter(this.localAdapter);
  }
}
