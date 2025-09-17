/**
 * Agent System Usage Examples
 *
 * This file contains practical examples of how to use the agent system
 * in your NestJS application. These examples assume you have properly
 * configured API keys in your environment variables.
 */

import { Injectable } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentTaskService } from './tasks/agent-task.service';
import { PromptService } from './prompt/prompt.service';
import {
  AgentOrchestrationPlan,
  AgentMessage,
  AgentCompletionOptions,
} from './agent.adapter.interface';

@Injectable()
export class AgentUsageExamples {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly taskService: AgentTaskService,
    private readonly promptService: PromptService,
  ) { }

  /**
   * Example 1: Simple chat interaction
   */
  async simpleChatExample(): Promise<void> {
    console.log('=== Simple Chat Example ===');

    const response = await this.agentsService.chat(
      'What are the benefits of using TypeScript in a Node.js project?',
      'local', // Use local adapter for testing
    );

    console.log(
      'Question: What are the benefits of using TypeScript in a Node.js project?',
    );
    console.log('Answer:', response.content);
    console.log('Usage:', response.usage);
  }

  /**
   * Example 2: Code analysis
   */
  async codeAnalysisExample(): Promise<void> {
    console.log('\n=== Code Analysis Example ===');

    const codeToAnalyze = `
    function calculateTotal(items) {
      var total = 0;
      for (var i = 0; i < items.length; i++) {
        total += items[i].price;
      }
      return total;
    }
    `;

    const analysis = await this.agentsService.analyzeCode(
      codeToAnalyze,
      'javascript',
      'code quality, modern JavaScript practices, potential improvements',
      'local',
    );

    console.log('Code to analyze:', codeToAnalyze);
    console.log('Analysis:', analysis.content);
  }

  /**
   * Example 3: Direct completion with custom messages
   */
  async directCompletionExample(): Promise<void> {
    console.log('\n=== Direct Completion Example ===');

    const messages: AgentMessage[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant that explains programming concepts clearly and concisely.',
      },
      {
        role: 'user',
        content:
          'Explain the difference between async/await and Promises in JavaScript',
      },
    ];

    const options: AgentCompletionOptions = {
      temperature: 0.7,
      maxTokens: 500,
    };

    const response = await this.agentsService.simpleCompletion({
      messages,
      options,
      provider: 'local',
    });

    console.log('Messages:', messages);
    console.log('Response:', response.content);
  }

  /**
   * Example 4: Using custom prompt templates
   */
  async customTemplateExample(): Promise<void> {
    console.log('\n=== Custom Template Example ===');

    // Register a custom template
    this.promptService.registerTemplate({
      id: 'api-documentation',
      name: 'api-documentation',
      version: '1.0.0',
      description: 'Generate API documentation for endpoints',
      template: `Generate comprehensive API documentation for the following endpoint:

Method: {method}
Path: {path}
Description: {description}

Include:
1. Request/Response examples
2. Parameter descriptions
3. Error codes
4. Usage examples`,
      variables: ['method', 'path', 'description'],
      systemPrompt:
        'You are a technical writer specializing in API documentation. Create clear, comprehensive documentation.',
    });

    // Use the template
    const response = await this.agentsService.templateCompletion({
      templateName: 'api-documentation',
      context: {
        method: 'POST',
        path: '/api/users',
        description: 'Create a new user account',
      },
      provider: 'local',
    });

    console.log('Generated API Documentation:', response.content);
  }

  /**
   * Example 5: Multi-step orchestration
   */
  async multiStepOrchestrationExample(): Promise<void> {
    console.log('\n=== Multi-Step Orchestration Example ===');

    const plan: AgentOrchestrationPlan = {
      id: 'comprehensive-code-review',
      name: 'Comprehensive Code Review',
      description: 'Multi-step code review process',
      steps: [
        {
          id: 'syntax-analysis',
          name: 'Syntax and Structure Analysis',
          adapter: 'local',
          prompt:
            'Analyze the syntax and structure of this JavaScript code: {code}',
        },
        {
          id: 'security-review',
          name: 'Security Vulnerability Review',
          adapter: 'local',
          prompt: 'Review this code for security vulnerabilities: {code}',
          dependsOn: ['syntax-analysis'],
        },
        {
          id: 'performance-analysis',
          name: 'Performance Analysis',
          adapter: 'local',
          prompt:
            'Analyze this code for performance optimization opportunities: {code}',
          dependsOn: ['syntax-analysis'],
        },
        {
          id: 'final-recommendations',
          name: 'Final Recommendations',
          adapter: 'local',
          prompt:
            'Based on the previous analyses, provide final recommendations for this code',
          dependsOn: ['security-review', 'performance-analysis'],
        },
      ],
    };

    const execution = await this.agentsService.executeMultiStep({
      plan,
      context: {
        code: `
        function processUserData(userData) {
          let result = {};
          for (let key in userData) {
            result[key] = userData[key].toString().toUpperCase();
          }
          return result;
        }
        `,
      },
    });

    console.log('Execution ID:', execution.id);
    console.log('Status:', execution.status);
    console.log('Results:', Object.keys(execution.results));

    // Print each step's result
    Object.entries(execution.results).forEach(([stepId, result]) => {
      console.log(`\n--- ${stepId} ---`);
      console.log(result.content);
    });
  }

  /**
   * Example 6: Task management and monitoring
   */
  async taskManagementExample(): Promise<void> {
    console.log('\n=== Task Management Example ===');

    // Create a task
    const task = this.taskService.createTask({
      type: 'completion',
      messages: [
        { role: 'user', content: 'Explain dependency injection in NestJS' },
      ],
      metadata: { category: 'education' },
    });

    console.log('Created task:', task.id);

    // Execute the task
    const result = await this.taskService.executeTask(task.id, 'local');
    console.log('Task result:', result.response.content);

    // Get statistics
    const stats = await this.taskService.getStatistics();
    console.log('System statistics:', stats);
  }

  /**
   * Example 7: Error handling and validation
   */
  async errorHandlingExample(): Promise<void> {
    console.log('\n=== Error Handling Example ===');

    try {
      // This will fail because we're using a non-existent adapter
      await this.agentsService.simpleCompletion({
        messages: [{ role: 'user', content: 'Hello' }],
        provider: 'non-existent-provider',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log('Caught expected error:', errorMessage);
    }

    // Validate adapters
    const validation = await this.taskService.validateAdapters();
    console.log('Adapter validation results:', validation);

    // Get available adapters
    const adapters = this.taskService.getAvailableAdapters();
    console.log('Available adapters:', adapters);
  }

  /**
   * Example 8: Streaming responses (for real-time applications)
   */
  async streamingExample(): Promise<void> {
    console.log('\n=== Streaming Example ===');

    // Note: This is a conceptual example - streaming would typically be used
    // in a controller to send real-time responses to the client

    const adapter = this.taskService.getAdapter('local');
    const messages: AgentMessage[] = [
      {
        role: 'user',
        content: 'Tell me a story about artificial intelligence',
      },
    ];

    console.log('Streaming response:');

    for await (const chunk of adapter.completeStream(messages)) {
      process.stdout.write(chunk.delta);

      if (chunk.finished) {
        console.log('\n--- Streaming complete ---');
        break;
      }
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('🤖 Agent System Usage Examples\n');

    await this.simpleChatExample();
    await this.codeAnalysisExample();
    await this.directCompletionExample();
    await this.customTemplateExample();
    await this.multiStepOrchestrationExample();
    await this.taskManagementExample();
    await this.errorHandlingExample();
    await this.streamingExample();

    console.log('\n✅ All examples completed successfully!');
  }
}

/**
 * If you want to run these examples directly, you can create a simple script:
 *
 * ```typescript
 * import { NestFactory } from '@nestjs/core';
 * import { AppModule } from './app.module';
 * import { AgentUsageExamples } from './agents/usage-examples';
 *
 * async function runExamples() {
 *   const app = await NestFactory.createApplicationContext(AppModule);
 *   const examples = app.get(AgentUsageExamples);
 *   await examples.runAllExamples();
 *   await app.close();
 * }
 *
 * runExamples();
 * ```
 */
