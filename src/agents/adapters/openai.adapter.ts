import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AgentAdapter,
  AgentMessage,
  AgentCompletionOptions,
  AgentCompletionResponse,
  AgentCompletionStreamChunk,
  AgentAdapterConfig,
} from '../agent.adapter.interface';

@Injectable()
export class OpenAIAdapter implements AgentAdapter {
  private readonly logger = new Logger(OpenAIAdapter.name);
  private openai: OpenAI | null = null;
  private config: AgentAdapterConfig;

  readonly provider = 'openai';

  constructor(private configService: ConfigService) {
    this.config = {
      provider: 'openai',
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseUrl: this.configService.get<string>('OPENAI_BASE_URL'),
      model: this.configService.get<string>(
        'OPENAI_DEFAULT_MODEL',
        'gpt-4o-mini',
      ),
      defaultOptions: {
        temperature: this.configService.get<number>('OPENAI_TEMPERATURE', 0.7),
        maxTokens: this.configService.get<number>('OPENAI_MAX_TOKENS', 4096),
      },
    };

    if (this.isConfigured()) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      this.logger.warn('OpenAI API key not configured');
      return;
    }

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });

    this.logger.log('OpenAI client initialized');
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async validateConfig(): Promise<boolean> {
    if (!this.isConfigured() || !this.openai) {
      return false;
    }

    try {
      // Test with a simple API call
      await this.openai.models.list();
      this.logger.log('OpenAI configuration validated successfully');
      return true;
    } catch (error) {
      this.logger.error('OpenAI configuration validation failed:', error);
      return false;
    }
  }

  private mapMessages(
    messages: AgentMessage[],
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async complete(
    messages: AgentMessage[],
    options?: AgentCompletionOptions,
  ): Promise<AgentCompletionResponse> {
    if (!this.openai) {
      throw new Error(
        'OpenAI client not initialized. Check API key configuration.',
      );
    }

    try {
      const mappedMessages = this.mapMessages(messages);
      const completionOptions = {
        ...this.config.defaultOptions,
        ...options,
      };

      const response = await this.openai.chat.completions.create({
        model: options?.model || this.config.model || 'gpt-4o-mini',
        messages: mappedMessages,
        temperature: completionOptions.temperature,
        max_tokens: completionOptions.maxTokens,
        top_p: completionOptions.topP,
        stop: completionOptions.stopSequences,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: choice.message.content,
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        metadata: {
          model: response.model,
          id: response.id,
          created: response.created,
        },
      };
    } catch (error) {
      this.logger.error('OpenAI completion failed:', error);
      throw new Error(
        `OpenAI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async *completeStream(
    messages: AgentMessage[],
    options?: AgentCompletionOptions,
  ): AsyncGenerator<AgentCompletionStreamChunk> {
    if (!this.openai) {
      throw new Error(
        'OpenAI client not initialized. Check API key configuration.',
      );
    }

    try {
      const mappedMessages = this.mapMessages(messages);
      const completionOptions = {
        ...this.config.defaultOptions,
        ...options,
      };

      const stream = await this.openai.chat.completions.create({
        model: options?.model || this.config.model || 'gpt-4o-mini',
        messages: mappedMessages,
        temperature: completionOptions.temperature,
        max_tokens: completionOptions.maxTokens,
        top_p: completionOptions.topP,
        stop: completionOptions.stopSequences,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        const finished = chunk.choices[0]?.finish_reason !== null;
        const finishReason = chunk.choices[0]?.finish_reason;

        yield {
          delta,
          finished,
          finishReason: finishReason || undefined,
        };
      }
    } catch (error) {
      this.logger.error('OpenAI streaming completion failed:', error);
      throw new Error(
        `OpenAI streaming completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.openai) {
      throw new Error(
        'OpenAI client not initialized. Check API key configuration.',
      );
    }

    try {
      const response = await this.openai.models.list();
      return response.data
        .filter((model) => model.id.includes('gpt'))
        .map((model) => model.id)
        .sort();
    } catch (error) {
      this.logger.error('Failed to fetch OpenAI models:', error);
      throw new Error(
        `Failed to fetch OpenAI models: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private mapFinishReason(
    reason: string | null,
  ): AgentCompletionResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'function_call':
        return 'function_call';
      default:
        return undefined;
    }
  }
}
