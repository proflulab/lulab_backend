import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AgentAdapter,
  AgentMessage,
  AgentCompletionOptions,
  AgentCompletionResponse,
  AgentCompletionStreamChunk,
  AgentAdapterConfig,
} from '../agent.adapter.interface';

@Injectable()
export class AnthropicAdapter implements AgentAdapter {
  private readonly logger = new Logger(AnthropicAdapter.name);
  private anthropic: Anthropic | null = null;
  private config: AgentAdapterConfig;

  readonly provider = 'anthropic';

  constructor(private configService: ConfigService) {
    this.config = {
      provider: 'anthropic',
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      baseUrl: this.configService.get<string>('ANTHROPIC_BASE_URL'),
      model: this.configService.get<string>(
        'ANTHROPIC_DEFAULT_MODEL',
        'claude-3-5-sonnet-20241022',
      ),
      defaultOptions: {
        temperature: this.configService.get<number>(
          'ANTHROPIC_TEMPERATURE',
          0.7,
        ),
        maxTokens: this.configService.get<number>('ANTHROPIC_MAX_TOKENS', 4096),
      },
    };

    if (this.isConfigured()) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      this.logger.warn('Anthropic API key not configured');
      return;
    }

    this.anthropic = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });

    this.logger.log('Anthropic client initialized');
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async validateConfig(): Promise<boolean> {
    if (!this.isConfigured() || !this.anthropic) {
      return false;
    }

    try {
      // Test with a simple API call
      await this.anthropic.messages.create({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      this.logger.log('Anthropic configuration validated successfully');
      return true;
    } catch (error) {
      this.logger.error('Anthropic configuration validation failed:', error);
      return false;
    }
  }

  private mapMessages(messages: AgentMessage[]): Anthropic.MessageParam[] {
    const mapped: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Anthropic handles system messages differently - they are passed as a separate parameter
        continue;
      }

      mapped.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return mapped;
  }

  private extractSystemMessage(messages: AgentMessage[]): string | undefined {
    const systemMessage = messages.find((msg) => msg.role === 'system');
    return systemMessage?.content;
  }

  async complete(
    messages: AgentMessage[],
    options?: AgentCompletionOptions,
  ): Promise<AgentCompletionResponse> {
    if (!this.anthropic) {
      throw new Error(
        'Anthropic client not initialized. Check API key configuration.',
      );
    }

    try {
      const mappedMessages = this.mapMessages(messages);
      const systemMessage = this.extractSystemMessage(messages);
      const completionOptions = {
        ...this.config.defaultOptions,
        ...options,
      };

      const requestParams: Anthropic.MessageCreateParams = {
        model:
          options?.model || this.config.model || 'claude-3-5-sonnet-20241022',
        messages: mappedMessages,
        max_tokens: completionOptions.maxTokens || 4096,
        temperature: completionOptions.temperature,
        top_p: completionOptions.topP,
        stop_sequences: completionOptions.stopSequences,
        stream: false,
      };

      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      const response = await this.anthropic.messages.create(requestParams);

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        content,
        finishReason: this.mapFinishReason(response.stop_reason),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
        metadata: {
          model: response.model,
          id: response.id,
          role: response.role,
          stopReason: response.stop_reason,
        },
      };
    } catch (error) {
      this.logger.error('Anthropic completion failed:', error);
      throw new Error(
        `Anthropic completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async *completeStream(
    messages: AgentMessage[],
    options?: AgentCompletionOptions,
  ): AsyncGenerator<AgentCompletionStreamChunk> {
    if (!this.anthropic) {
      throw new Error(
        'Anthropic client not initialized. Check API key configuration.',
      );
    }

    try {
      const mappedMessages = this.mapMessages(messages);
      const systemMessage = this.extractSystemMessage(messages);
      const completionOptions = {
        ...this.config.defaultOptions,
        ...options,
      };

      const requestParams: Anthropic.MessageCreateParamsStreaming = {
        model:
          options?.model || this.config.model || 'claude-3-5-sonnet-20241022',
        messages: mappedMessages,
        max_tokens: completionOptions.maxTokens || 4096,
        temperature: completionOptions.temperature,
        top_p: completionOptions.topP,
        stop_sequences: completionOptions.stopSequences,
        stream: true,
      };

      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      const stream = this.anthropic.messages.stream(requestParams);

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          yield {
            delta: chunk.delta.text,
            finished: false,
          };
        } else if (chunk.type === 'message_stop') {
          yield {
            delta: '',
            finished: true,
          };
        }
      }
    } catch (error) {
      this.logger.error('Anthropic streaming completion failed:', error);
      throw new Error(
        `Anthropic streaming completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a public API to list models, so we return known models
    return Promise.resolve([
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ]);
  }

  private mapFinishReason(
    reason: string | null,
  ): AgentCompletionResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return undefined;
    }
  }
}
