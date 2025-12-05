/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-05 18:30:33
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-05 18:32:56
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/utils/prompts.util.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

/**
 *  * 简单的提示词模板渲染函数
 * 将模板中的 {{key}} 替换为 variables 中的对应值
 * 支持 {{ key }} 格式（允许空格）
 */
export const renderPrompt = (
  template: string,
  variables: Record<string, string | number | undefined | null>,
): string => {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = variables[key];
    // 如果变量存在，则替换；否则保留原占位符（方便调试）或替换为空字符串
    return value !== undefined && value !== null ? String(value) : match;
  });
};

/**
 * 默认的参会者总结模板
 */
export const DEFAULT_PARTICIPANT_SUMMARY_TEMPLATE = `
你是专业的会议总结助手，请为参会者提供个性化的会议总结。

会议信息：
- 会议主题：{{subject}}
- 会议时间：{{start_time}} - {{end_time}}
- 参会者：{{username}}

会议内容：
{{ai_minutes}}

待办事项：
{{todo}}

录音转写：
{{transcript}}

请为参会者「{{username}}」生成一份个性化的会议总结，包含：
1. 会议要点回顾
2. 与该参会者相关的重要讨论
3. 该参会者需要关注的待办事项
4. 后续行动建议

请用中文回答，保持简洁专业。
`.trim();
