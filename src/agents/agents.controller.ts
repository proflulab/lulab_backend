import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '@/security';
import {
  AgentsService,
  SimpleCompletionRequest,
  TemplateCompletionRequest,
} from './agents.service';
import { AgentTaskService } from './tasks/agent-task.service';
import { PromptService } from './prompt/prompt.service';

export class ChatRequest {
  message!: string;
  provider?: string;
}

export class CodeAnalysisRequest {
  code!: string;
  language!: string;
  provider?: string;
}

@ApiTags('AI Agents')
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly taskService: AgentTaskService,
    private readonly promptService: PromptService,
  ) { }

  @Public()
  @Post('chat')
  @ApiOperation({ summary: 'Simple chat with AI agent' })
  @ApiBody({ type: ChatRequest })
  @ApiResponse({ status: 200, description: 'Chat response from AI agent' })
  async chat(@Body() request: ChatRequest) {
    return this.agentsService.chat(request.message, request.provider);
  }

  @Public()
  @Post('analyze-code')
  @ApiOperation({ summary: 'Analyze code using AI agent' })
  @ApiBody({ type: CodeAnalysisRequest })
  @ApiResponse({ status: 200, description: 'Code analysis from AI agent' })
  async analyzeCode(@Body() request: CodeAnalysisRequest) {
    return this.agentsService.analyzeCode(
      request.code,
      request.language,
      'quality, best practices, potential issues, suggestions',
      request.provider,
    );
  }

  @Public()
  @Post('completion')
  @ApiOperation({ summary: 'Direct completion with custom messages' })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 200,
    description: 'Completion response from AI agent',
  })
  async completion(@Body() request: SimpleCompletionRequest) {
    return this.agentsService.simpleCompletion(request);
  }

  @Public()
  @Post('template')
  @ApiOperation({ summary: 'Template-based completion' })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 200,
    description: 'Template completion response from AI agent',
  })
  async templateCompletion(@Body() request: TemplateCompletionRequest) {
    return this.agentsService.templateCompletion(request);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: 'Get agent system statistics' })
  @ApiResponse({ status: 200, description: 'Agent system statistics' })
  async getStatistics() {
    return this.agentsService.getStatistics();
  }

  @Public()
  @Get('adapters')
  @ApiOperation({ summary: 'Get available adapters' })
  @ApiResponse({ status: 200, description: 'List of available adapters' })
  async getAdapters() {
    return {
      adapters: this.taskService.getAvailableAdapters(),
      validation: await this.taskService.validateAdapters(),
    };
  }

  @Public()
  @Get('templates')
  @ApiOperation({ summary: 'Get available prompt templates' })
  @ApiResponse({
    status: 200,
    description: 'List of available prompt templates',
  })
  getTemplates() {
    return this.promptService.getTemplates();
  }

  @Public()
  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  getTask(@Param('id') id: string) {
    return this.taskService.getTask(id);
  }

  @Public()
  @Get('executions/:id')
  @ApiOperation({ summary: 'Get execution by ID' })
  @ApiResponse({ status: 200, description: 'Execution details' })
  getExecution(@Param('id') id: string) {
    return this.agentsService.getExecution(id);
  }
}
