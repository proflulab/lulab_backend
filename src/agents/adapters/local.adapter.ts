import { Injectable, Logger } from '@nestjs/common';
import {
  AgentAdapter,
  AgentMessage,
  AgentCompletionResponse,
  AgentCompletionStreamChunk,
} from '../agent.adapter.interface';

/**
 * Local adapter for testing and development purposes
 * Provides mock responses without calling external APIs
 */
@Injectable()
export class LocalAdapter implements AgentAdapter {
  private readonly logger = new Logger(LocalAdapter.name);

  readonly provider = 'local';

  isConfigured(): boolean {
    return true; // Local adapter is always configured
  }

  async validateConfig(): Promise<boolean> {
    return Promise.resolve(true); // Local adapter is always valid
  }

  async complete(messages: AgentMessage[]): Promise<AgentCompletionResponse> {
    this.logger.debug(`Local adapter processing ${messages.length} messages`);

    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000),
    );

    const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop();

    const mockContent = this.generateMockResponse(
      lastUserMessage?.content || 'Hello',
    );

    return {
      content: mockContent,
      finishReason: 'stop',
      usage: {
        promptTokens: messages.reduce(
          (acc, msg) => acc + msg.content.length / 4,
          0,
        ),
        completionTokens: mockContent.length / 4,
        totalTokens:
          messages.reduce((acc, msg) => acc + msg.content.length / 4, 0) +
          mockContent.length / 4,
      },
      metadata: {
        model: 'local-mock',
        provider: 'local',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async *completeStream(
    messages: AgentMessage[],
  ): AsyncGenerator<AgentCompletionStreamChunk> {
    this.logger.debug(`Local adapter streaming ${messages.length} messages`);

    const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop();

    const mockContent = this.generateMockResponse(
      lastUserMessage?.content || 'Hello',
    );
    const words = mockContent.split(' ');

    for (let i = 0; i < words.length; i++) {
      // Simulate streaming delay
      await new Promise((resolve) =>
        setTimeout(resolve, 50 + Math.random() * 100),
      );

      const word = words[i];
      const isLast = i === words.length - 1;

      yield {
        delta: i === 0 ? word : ` ${word}`,
        finished: isLast,
        finishReason: isLast ? 'stop' : undefined,
      };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return Promise.resolve(['local-mock', 'local-test', 'local-debug']);
  }

  private generateMockResponse(input: string): string {
    const responses = [
      `I understand you're asking about: "${input}". As a local mock adapter, I'm providing a simulated response for testing purposes.`,
      `Thank you for your input: "${input}". This is a mock response from the local adapter, designed for development and testing scenarios.`,
      `Your message "${input}" has been processed by the local adapter. This response demonstrates the agent system's capability without external API calls.`,
      `Processing your request about "${input}". The local adapter provides consistent mock responses for reliable testing of the agent orchestration system.`,
    ];

    const selectedResponse =
      responses[Math.floor(Math.random() * responses.length)];

    // Add some variation based on input length
    if (input.length > 50) {
      return (
        selectedResponse +
        " Since your input was quite detailed, I'm providing an extended response to simulate realistic API behavior."
      );
    }

    return selectedResponse;
  }
}
