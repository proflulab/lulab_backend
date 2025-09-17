/**
 * Core agent adapter interface for AI model providers
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AgentCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  stream?: boolean;
  model?: string;
}

export interface AgentCompletionResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AgentCompletionStreamChunk {
  delta: string;
  finished: boolean;
  finishReason?: string;
}

export interface AgentAdapter {
  /**
   * Provider name (e.g., 'openai', 'anthropic', 'deepseek')
   */
  readonly provider: string;

  /**
   * Check if the adapter is properly configured and ready to use
   */
  isConfigured(): boolean;

  /**
   * Generate a completion from a list of messages
   */
  complete(
    messages: AgentMessage[],
    options?: AgentCompletionOptions,
  ): Promise<AgentCompletionResponse>;

  /**
   * Generate a streaming completion from a list of messages
   */
  completeStream(
    messages: AgentMessage[],
    options?: AgentCompletionOptions,
  ): AsyncGenerator<AgentCompletionStreamChunk>;

  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<string[]>;

  /**
   * Validate adapter configuration
   */
  validateConfig(): Promise<boolean>;
}

export interface AgentAdapterConfig {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  defaultOptions?: AgentCompletionOptions;
}

export interface AgentTask {
  id: string;
  type: 'completion' | 'analysis' | 'generation' | 'classification';
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: {
    messages: AgentMessage[];
    options?: AgentCompletionOptions;
  };
  output?: AgentCompletionResponse;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AgentOrchestrationStep {
  id: string;
  name: string;
  adapter: string;
  prompt: string;
  dependsOn?: string[];
  condition?: (context: Record<string, unknown>) => boolean;
  transform?: (
    input: unknown,
    context: Record<string, unknown>,
  ) => AgentMessage[];
}

export interface AgentOrchestrationPlan {
  id: string;
  name: string;
  description?: string;
  steps: AgentOrchestrationStep[];
  maxRetries?: number;
  timeout?: number;
}

export interface AgentOrchestrationExecution {
  id: string;
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  context: Record<string, unknown>;
  results: Record<string, AgentCompletionResponse>;
  errors: Record<string, string>;
  startedAt: Date;
  completedAt?: Date;
}
