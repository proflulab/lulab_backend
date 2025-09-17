import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AgentMessage } from '../agent.adapter.interface';

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  version: string;
  template: string;
  variables: string[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptContext {
  [key: string]: unknown;
}

export interface PromptRenderOptions {
  escapeHtml?: boolean;
  stripWhitespace?: boolean;
  validateVariables?: boolean;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly templates = new Map<string, PromptTemplate>();
  private readonly templateVersions = new Map<
    string,
    Map<string, PromptTemplate>
  >();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Register a new prompt template
   */
  registerTemplate(
    template: Omit<PromptTemplate, 'createdAt' | 'updatedAt'>,
  ): void {
    const fullTemplate: PromptTemplate = {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store by ID
    this.templates.set(template.id, fullTemplate);

    // Store by name and version
    if (!this.templateVersions.has(template.name)) {
      this.templateVersions.set(template.name, new Map());
    }
    this.templateVersions
      .get(template.name)!
      .set(template.version, fullTemplate);

    this.logger.log(
      `Registered prompt template: ${template.name} v${template.version}`,
    );
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): PromptTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new NotFoundException(`Prompt template with ID '${id}' not found`);
    }
    return template;
  }

  /**
   * Get a template by name and version
   */
  getTemplateByVersion(name: string, version?: string): PromptTemplate {
    const versions = this.templateVersions.get(name);
    if (!versions) {
      throw new NotFoundException(`Prompt template '${name}' not found`);
    }

    if (!version) {
      // Get the latest version
      const latestVersion = Array.from(versions.keys()).sort().pop();
      if (!latestVersion) {
        throw new NotFoundException(`No versions found for template '${name}'`);
      }
      version = latestVersion;
    }

    const template = versions.get(version);
    if (!template) {
      throw new NotFoundException(
        `Template '${name}' version '${version}' not found`,
      );
    }

    return template;
  }

  /**
   * Get all available templates
   */
  getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get all versions of a template
   */
  getTemplateVersions(name: string): PromptTemplate[] {
    const versions = this.templateVersions.get(name);
    if (!versions) {
      throw new NotFoundException(`Prompt template '${name}' not found`);
    }
    return Array.from(versions.values());
  }

  /**
   * Render a template with context variables
   */
  renderTemplate(
    templateId: string,
    context: PromptContext,
    options: PromptRenderOptions = {},
  ): string {
    const template = this.getTemplate(templateId);
    return this.renderTemplateContent(template, context, options);
  }

  /**
   * Render a template by name and version
   */
  renderTemplateByVersion(
    name: string,
    context: PromptContext,
    version?: string,
    options: PromptRenderOptions = {},
  ): string {
    const template = this.getTemplateByVersion(name, version);
    return this.renderTemplateContent(template, context, options);
  }

  /**
   * Create AgentMessages from a template
   */
  createMessages(
    templateId: string,
    context: PromptContext,
    options: PromptRenderOptions = {},
  ): AgentMessage[] {
    const template = this.getTemplate(templateId);
    const messages: AgentMessage[] = [];

    // Add system message if present
    if (template.systemPrompt) {
      const systemContent = this.interpolateString(
        template.systemPrompt,
        context,
        options,
      );
      messages.push({
        role: 'system',
        content: systemContent,
      });
    }

    // Add main prompt as user message
    const userContent = this.renderTemplateContent(template, context, options);
    messages.push({
      role: 'user',
      content: userContent,
    });

    return messages;
  }

  /**
   * Create AgentMessages from a template by name and version
   */
  createMessagesByVersion(
    name: string,
    context: PromptContext,
    version?: string,
    options: PromptRenderOptions = {},
  ): AgentMessage[] {
    const template = this.getTemplateByVersion(name, version);
    const messages: AgentMessage[] = [];

    // Add system message if present
    if (template.systemPrompt) {
      const systemContent = this.interpolateString(
        template.systemPrompt,
        context,
        options,
      );
      messages.push({
        role: 'system',
        content: systemContent,
      });
    }

    // Add main prompt as user message
    const userContent = this.renderTemplateContent(template, context, options);
    messages.push({
      role: 'user',
      content: userContent,
    });

    return messages;
  }

  private renderTemplateContent(
    template: PromptTemplate,
    context: PromptContext,
    options: PromptRenderOptions,
  ): string {
    if (options.validateVariables) {
      this.validateContext(template, context);
    }

    return this.interpolateString(template.template, context, options);
  }

  private interpolateString(
    templateStr: string,
    context: PromptContext,
    options: PromptRenderOptions,
  ): string {
    let result = templateStr;

    // Replace variables in the format {{variable}} or {variable}
    result = result.replace(
      /\{\{([^}]+)\}\}/g,
      (match, variableName: string) => {
        const value = this.getNestedValue(context, variableName.trim());
        return this.formatValue(value, options);
      },
    );

    result = result.replace(/\{([^}]+)\}/g, (match, variableName: string) => {
      const value = this.getNestedValue(context, variableName.trim());
      return this.formatValue(value, options);
    });

    if (options.stripWhitespace) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    return result;
  }

  private getNestedValue(obj: PromptContext, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object'
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }

  private formatValue(value: unknown, options: PromptRenderOptions): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue: string;
    if (typeof value === 'object' && value !== null) {
      try {
        stringValue = JSON.stringify(value);
      } catch {
        stringValue = '[Complex Object]';
      }
    } else {
      stringValue = '[Complex Object]';
    }

    if (options.escapeHtml) {
      stringValue = stringValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    return stringValue;
  }

  private validateContext(
    template: PromptTemplate,
    context: PromptContext,
  ): void {
    const missingVariables = template.variables.filter(
      (variable) => this.getNestedValue(context, variable) === undefined,
    );

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required variables for template '${template.name}': ${missingVariables.join(', ')}`,
      );
    }
  }

  private initializeDefaultTemplates(): void {
    // Default templates for common use cases
    this.registerTemplate({
      id: 'simple-chat',
      name: 'simple-chat',
      version: '1.0.0',
      description: 'Simple chat template for general conversations',
      template: "User: {userInput}\n\nPlease respond to the user's message.",
      variables: ['userInput'],
      systemPrompt:
        'You are a helpful AI assistant. Respond clearly and helpfully to user queries.',
    });

    this.registerTemplate({
      id: 'code-review',
      name: 'code-review',
      version: '1.0.0',
      description: 'Template for code review tasks',
      template:
        'Please review the following code:\n\n```{language}\n{code}\n```\n\nProvide feedback on:\n1. Code quality\n2. Best practices\n3. Potential issues\n4. Suggestions for improvement',
      variables: ['code', 'language'],
      systemPrompt:
        'You are an expert code reviewer. Provide constructive feedback on code quality, best practices, and potential improvements.',
    });

    this.registerTemplate({
      id: 'text-analysis',
      name: 'text-analysis',
      version: '1.0.0',
      description: 'Template for text analysis tasks',
      template:
        'Please analyze the following text:\n\n"{text}"\n\nProvide analysis on:\n{analysisType}',
      variables: ['text', 'analysisType'],
      systemPrompt:
        'You are a text analysis expert. Provide thorough and accurate analysis of the given text.',
    });

    this.registerTemplate({
      id: 'multi-step-task',
      name: 'multi-step-task',
      version: '1.0.0',
      description: 'Template for breaking down complex tasks into steps',
      template:
        'Please break down the following task into detailed steps:\n\nTask: {task}\n\nContext: {context}\n\nProvide a numbered list of steps with clear instructions.',
      variables: ['task', 'context'],
      systemPrompt:
        'You are a task planning expert. Break down complex tasks into clear, actionable steps.',
    });
  }
}
