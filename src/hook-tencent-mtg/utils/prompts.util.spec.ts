import { renderPrompt, DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE } from './prompts.util';

describe('PromptsUtil', () => {
  describe('renderPrompt', () => {
    it('should replace variables in the template', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: 'World' };
      expect(renderPrompt(template, variables)).toBe('Hello, World!');
    });

    it('should handle multiple variables', () => {
      const template = '{{greeting}}, {{name}}!';
      const variables = { greeting: 'Hi', name: 'Alice' };
      expect(renderPrompt(template, variables)).toBe('Hi, Alice!');
    });

    it('should handle spaces in placeholders', () => {
      const template = 'Hello, {{ name }}!';
      const variables = { name: 'Bob' };
      expect(renderPrompt(template, variables)).toBe('Hello, Bob!');
    });

    it('should handle numeric values', () => {
      const template = 'Count: {{count}}';
      const variables = { count: 42 };
      expect(renderPrompt(template, variables)).toBe('Count: 42');
    });

    it('should keep placeholder if variable is missing', () => {
      const template = 'Hello, {{name}}!';
      const variables = {};
      expect(renderPrompt(template, variables)).toBe('Hello, {{name}}!');
    });

    it('should keep placeholder if variable is undefined', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: undefined };
      expect(renderPrompt(template, variables)).toBe('Hello, {{name}}!');
    });

    it('should keep placeholder if variable is null', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: null };
      expect(renderPrompt(template, variables)).toBe('Hello, {{name}}!');
    });

    it('should handle empty string value', () => {
      const template = 'Value: [{{val}}]';
      const variables = { val: '' };
      expect(renderPrompt(template, variables)).toBe('Value: []');
    });

    it('should handle template without placeholders', () => {
      const template = 'No placeholders here';
      const variables = { key: 'value' };
      expect(renderPrompt(template, variables)).toBe('No placeholders here');
    });
  });

  describe('DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE', () => {
    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toBe('string');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE.length).toBeGreaterThan(0);
    });

    it('should contain required placeholders', () => {
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{subject}}');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{start_time}}');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{end_time}}');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{username}}');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{ai_minutes}}');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{todo}}');
      expect(DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE).toContain('{{transcript}}');
    });
  });
});
