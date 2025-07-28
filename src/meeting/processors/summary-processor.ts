import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { TextAnalysisUtil } from '../utils/text-analysis.util';
import { TextFileProcessor } from './text-processor.base';

/**
 * 摘要文件处理器
 */
@Injectable()
export class SummaryProcessor extends TextFileProcessor {
    protected readonly logger = new Logger(SummaryProcessor.name);

    readonly supportedFileTypes: FileType[] = [FileType.SUMMARY];
    readonly supportedMimeTypes: string[] = [
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json',
        'text/xml',
        'application/xml'
    ];

    constructor(httpService: HttpService) {
        super(httpService);
    }

    protected getTextType(): string {
        return '摘要';
    }

    protected async getSpecificMetadata(content: string): Promise<any> {
        // 提取摘要结构化信息
        const structuredSummary = await this.extractStructuredInfo(content);
        
        return {
            keyPoints: structuredSummary.keyPoints,
            actionItems: structuredSummary.actionItems,
            participants: structuredSummary.participants,
            topics: structuredSummary.topics
        };
    }

    getName(): string {
        return 'SummaryProcessor';
    }

    /**
     * 处理摘要内容
     */
    protected async processTextContent(content: string, mimeType: string): Promise<string> {
        switch (mimeType) {
            case 'text/markdown':
                return this.processMarkdownContent(content);
            case 'text/html':
                return this.processHTMLContent(content);
            case 'application/json':
                return super.processJSONContent(content);
            case 'text/xml':
            case 'application/xml':
                return super.processXMLContent(content);
            case 'text/plain':
            default:
                return super.processPlainTextContent(content);
        }
    }

    /**
     * 处理Markdown格式内容
     */
    protected processMarkdownContent(content: string): string {
        // 保留Markdown格式，只做基本清理
        return content.trim();
    }

    /**
     * 处理HTML格式内容
     */
    protected processHTMLContent(content: string): string {
        // 移除HTML标签，保留文本内容
        return content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 处理JSON格式内容
     */
    protected processJSONContent(content: string): string {
        try {
            const data = JSON.parse(content);

            // 尝试不同的JSON结构
            if (data.summary) {
                return data.summary;
            }
            if (data.content) {
                return data.content;
            }
            if (data.text) {
                return data.text;
            }

            // 如果是结构化摘要，组合各部分
            let summary = '';
            if (data.title) summary += `# ${data.title}\n\n`;
            if (data.overview) summary += `## 概述\n${data.overview}\n\n`;
            if (data.keyPoints) {
                summary += `## 要点\n`;
                data.keyPoints.forEach((point: string, index: number) => {
                    summary += `${index + 1}. ${point}\n`;
                });
                summary += '\n';
            }
            if (data.actionItems) {
                summary += `## 行动项\n`;
                data.actionItems.forEach((item: string, index: number) => {
                    summary += `${index + 1}. ${item}\n`;
                });
                summary += '\n';
            }

            return summary || JSON.stringify(data, null, 2);
        } catch (error) {
            this.logger.warn('JSON摘要内容解析失败，作为纯文本处理');
            return content;
        }
    }

    /**
     * 处理XML格式内容
     */
    protected processXMLContent(content: string): string {
        // 简单的XML文本提取，移除所有标签
        return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * 处理纯文本内容
     */
    protected processPlainTextContent(content: string): string {
        // 清理多余的空白字符
        return content.replace(/\s+/g, ' ').trim();
    }

    /**
     * 提取结构化信息
     */
    protected async extractStructuredInfo(content: string): Promise<{
        keyPoints: string[];
        actionItems: string[];
        participants: string[];
        topics: string[];
    }> {
        const result: {
            keyPoints: string[];
            actionItems: string[];
            participants: string[];
            topics: string[];
        } = {
            keyPoints: [],
            actionItems: [],
            participants: [],
            topics: []
        };

        try {
            // 提取要点
            result.keyPoints = this.extractKeyPoints(content);

            // 提取行动项
            result.actionItems = this.extractActionItems(content);

            // 提取参与者
            result.participants = this.extractParticipants(content);

            // 提取主题
            result.topics = this.extractTopics(content);
        } catch (error) {
            this.logger.warn('提取结构化信息失败', error.message);
        }

        return result;
    }

    /**
     * 提取要点
     */
    private extractKeyPoints(content: string): string[] {
        const keyPoints: string[] = [];

        // 匹配编号列表
        const numberedMatches = content.match(/\d+\.[^\n]+/g);
        if (numberedMatches) {
            keyPoints.push(...numberedMatches.map(match => match.replace(/^\d+\.\s*/, '')));
        }

        // 匹配项目符号列表
        const bulletMatches = content.match(/[•\-\*]\s+[^\n]+/g);
        if (bulletMatches) {
            keyPoints.push(...bulletMatches.map(match => match.replace(/^[•\-\*]\s+/, '')));
        }

        return keyPoints.slice(0, 10); // 限制数量
    }

    /**
     * 提取行动项
     */
    private extractActionItems(content: string): string[] {
        const actionItems: string[] = [];

        // 匹配包含行动词汇的句子
        const actionKeywords = ['需要', '应该', '必须', '计划', '安排', '负责', 'TODO', 'Action'];
        const sentences = content.split(/[。！？.!?]/);

        sentences.forEach(sentence => {
            if (actionKeywords.some(keyword => sentence.includes(keyword))) {
                actionItems.push(sentence.trim());
            }
        });

        return actionItems.slice(0, 5); // 限制数量
    }

    /**
     * 提取参与者
     */
    private extractParticipants(content: string): string[] {
        const participants: string[] = [];

        // 匹配人名模式（简单实现）
        const namePatterns = [
            /([A-Z][a-z]+\s+[A-Z][a-z]+)/g, // 英文姓名
            /([\u4e00-\u9fff]{2,4})/g // 中文姓名
        ];

        namePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                participants.push(...matches);
            }
        });

        // 去重并限制数量
        return [...new Set(participants)].slice(0, 10);
    }

    /**
     * 提取主题
     */
    private extractTopics(content: string): string[] {
        const topics: string[] = [];

        // 匹配标题模式
        const titleMatches = content.match(/^#+\s+(.+)$/gm);
        if (titleMatches) {
            topics.push(...titleMatches.map(match => match.replace(/^#+\s+/, '')));
        }

        // 使用工具类提取关键词
        const keywords = TextAnalysisUtil.extractKeywords(content, 5);
        topics.push(...keywords);

        return [...new Set(topics)].slice(0, 10);
    }




}