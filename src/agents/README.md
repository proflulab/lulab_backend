# AI Agent System

This is a comprehensive AI agent system integrated into the NestJS backend that supports multiple AI model providers including OpenAI, Anthropic, DeepSeek, and includes a local testing adapter.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic (Claude), DeepSeek, and Local testing
- **Template System**: Reusable prompt templates with versioning
- **Task Management**: Asynchronous task execution and tracking
- **Multi-Step Orchestration**: Complex workflow execution with dependency management
- **RESTful API**: Easy-to-use HTTP endpoints for all agent functionalities
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Directory Structure

```
src/agents/
├── adapters/           # AI model provider adapters
│   ├── openai.adapter.ts
│   ├── anthropic.adapter.ts
│   ├── deepseek.adapter.ts
│   └── local.adapter.ts
├── prompt/             # Prompt template management
│   └── prompt.service.ts
├── tasks/              # Task management system
│   ├── agent-task.repository.ts
│   └── agent-task.service.ts
├── agents.controller.ts # REST API endpoints
├── agents.service.ts   # Main orchestrator service
├── agents.module.ts    # NestJS module configuration
└── agent.adapter.interface.ts # Core interfaces
```

## Configuration

Add the following environment variables to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=4096

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_BASE_URL=https://api.anthropic.com  # Optional
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_TEMPERATURE=0.7
ANTHROPIC_MAX_TOKENS=4096

# DeepSeek Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_DEFAULT_MODEL=deepseek-chat
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_MAX_TOKENS=4096

# Agent System Configuration
AGENT_DEFAULT_PROVIDER=local  # Default provider: openai, anthropic, deepseek, local
```

## API Endpoints

### Chat
```bash
POST /agents/chat
{
  "message": "Hello, how are you?",
  "provider": "openai"  # Optional
}
```

### Code Analysis
```bash
POST /agents/analyze-code
{
  "code": "function hello() { console.log('Hello World'); }",
  "language": "javascript",
  "provider": "anthropic"  # Optional
}
```

### Direct Completion
```bash
POST /agents/completion
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Explain quantum computing"}
  ],
  "provider": "deepseek",
  "options": {
    "temperature": 0.5,
    "maxTokens": 2000
  }
}
```

### Template-based Completion
```bash
POST /agents/template
{
  "templateName": "code-review",
  "context": {
    "code": "const x = 1; var y = 2;",
    "language": "javascript"
  },
  "provider": "openai"
}
```

### System Information
```bash
GET /agents/statistics     # System statistics
GET /agents/adapters       # Available adapters and their status
GET /agents/templates      # Available prompt templates
GET /agents/tasks/:id      # Get task details
GET /agents/executions/:id # Get execution details
```

## Usage Examples

### Basic Chat
```typescript
import { AgentsService } from './agents/agents.service';

// Inject AgentsService in your controller or service
constructor(private readonly agentsService: AgentsService) {}

// Simple chat
const response = await this.agentsService.chat(
  "What is the capital of France?",
  "openai"  // Optional provider
);

console.log(response.content); // "The capital of France is Paris."
```

### Code Analysis
```typescript
const analysis = await this.agentsService.analyzeCode(
  `
  function calculateTotal(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
      total += items[i].price;
    }
    return total;
  }
  `,
  "javascript",
  "code quality, modern JavaScript practices, potential improvements",
  "anthropic"
);

console.log(analysis.content);
// Returns detailed code review with suggestions
```

### Custom Template Usage
```typescript
import { PromptService } from './agents/prompt/prompt.service';

// Register a custom template
this.promptService.registerTemplate({
  id: 'sql-review',
  name: 'sql-review',
  version: '1.0.0',
  description: 'SQL query review template',
  template: 'Please review this SQL query for performance and security:\n\n```sql\n{query}\n```\n\nDatabase: {database}',
  variables: ['query', 'database'],
  systemPrompt: 'You are a database expert. Focus on performance, security, and best practices.'
});

// Use the template
const response = await this.agentsService.templateCompletion({
  templateName: 'sql-review',
  context: {
    query: 'SELECT * FROM users WHERE id = ' + userId,
    database: 'PostgreSQL'
  },
  provider: 'openai'
});
```

### Multi-Step Orchestration
```typescript
const plan: AgentOrchestrationPlan = {
  id: 'code-review-plan',
  name: 'Comprehensive Code Review',
  steps: [
    {
      id: 'syntax-check',
      name: 'Syntax Analysis',
      adapter: 'openai',
      prompt: 'Analyze the syntax and structure of the provided code'
    },
    {
      id: 'security-review',
      name: 'Security Review',
      adapter: 'anthropic',
      prompt: 'Review the code for security vulnerabilities',
      dependsOn: ['syntax-check']
    },
    {
      id: 'performance-analysis',
      name: 'Performance Analysis',
      adapter: 'deepseek',
      prompt: 'Analyze the code for performance optimizations',
      dependsOn: ['syntax-check']
    },
    {
      id: 'final-report',
      name: 'Final Report',
      adapter: 'openai',
      prompt: 'Compile a comprehensive report based on previous analyses',
      dependsOn: ['security-review', 'performance-analysis']
    }
  ]
};

const execution = await this.agentsService.executeMultiStep({
  plan,
  context: { code: 'your code here', language: 'javascript' }
});
```

## Available Prompt Templates

The system comes with several built-in templates:

1. **simple-chat**: Basic conversational template
2. **code-review**: Code analysis and review
3. **text-analysis**: Text content analysis
4. **multi-step-task**: Task breakdown template

## Testing

All adapters include comprehensive error handling and the local adapter can be used for testing without external API calls:

```bash
# Test with local adapter (no API keys required)
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "provider": "local"}'
```

## Error Handling

The system includes robust error handling:
- Invalid API keys are detected during configuration validation
- Network errors are caught and reported
- Task failures are logged and can be retried
- Rate limiting and timeout handling for external APIs

## Monitoring

Use the statistics endpoint to monitor system health:

```bash
GET /agents/statistics
```

Returns:
- Task execution statistics by status and type
- Adapter availability and configuration status
- Execution history and performance metrics

## Contributing

When adding new adapters:

1. Implement the `AgentAdapter` interface
2. Add configuration options
3. Register the adapter in `AgentsModule`
4. Add tests for the new adapter
5. Update documentation

## License

This agent system is part of the LuLab Backend project.