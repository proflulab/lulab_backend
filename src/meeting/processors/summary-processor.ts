import { Injectable, Logger } from '@nestjs/common';
import { FileType, ProcessingStatus } from '@prisma/client';
import { BaseFileProcessor, FileProcessingParams, FileProcessingResult } from './file-processor.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * 摘要文件处理器
 */
@Injectable()
export class SummaryProcessor extends BaseFileProcessor {
    private readonly logger = new Logger(SummaryProcessor.name);

    readonly supportedFileTypes: FileType[] = [FileType.SUMMARY];
    readonly supportedMimeTypes: string[] = [
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json',
        'text/xml',
        'application/xml'
    ];

    constructor(private readonly httpService: HttpService) {
        super();
    }

    async process(params: FileProcessingParams): Promise<FileProcessingResult> {
        try {
            this.logger.log(`开始处理摘要文件: ${params.fileName}`);

            // 验证参数
            if (!await this.validate(params)) {
                return this.createErrorResult('摘要文件参数验证失败');
            }

            // 获取摘要内容
            const summaryContent = await this.getSummaryContent(params);
            if (!summaryContent) {
                return this.createErrorResult('无法获取摘要文件内容');
            }

            // 处理摘要内容
            const processedContent = await this.processSummaryContent(
                summaryContent,
                params.mimeType
            );

            // 提取摘要结构化信息
            const structuredSummary = await this.extractStructuredInfo(processedContent);

            // 生成元数据
            const metadata = {
                originalFormat: this.getFormatFromMimeType(params.mimeType),
                wordCount: this.countWords(processedContent),
                characterCount: processedContent.length,
                keyPoints: structuredSummary.keyPoints,
                actionItems: structuredSummary.actionItems,
                participants: structuredSummary.participants,
                topics: structuredSummary.topics,
                language: await this.detectLanguage(processedContent),
                processedAt: new Date().toISOString()
            };

            this.logger.log(`摘要文件处理完成: ${params.fileName}`);
            return this.createSuccessResult(processedContent, metadata);

        } catch (error) {
            this.logger.error(`摘要文件处理失败: ${params.fileName}`, error.stack);
            return this.createErrorResult(`摘要文件处理失败: ${error.message}`);
        }
    }

    async validate(params: FileProcessingParams): Promise<boolean> {
        // 调用基类验证
        if (!await super.validate(params)) {
            return false;
        }

        // 摘要文件特定验证
        if (params.fileType !== FileType.SUMMARY) {
            return false;
        }

        // 检查MIME类型
        if (!this.supportedMimeTypes.includes(params.mimeType)) {
            this.logger.warn(`不支持的摘要文件MIME类型: ${params.mimeType}`);
            return false;
        }

        return true;
    }

    getName(): string {
        return 'SummaryProcessor';
    }

    getVersion(): string {
        return '1.0.0';
    }

    /**
     * 获取摘要文件内容
     */
    private async getSummaryContent(params: FileProcessingParams): Promise<string | null> {
        try {
            // 如果已有内容，直接返回
            if (params.content) {
                return params.content;
            }

            // 从URL下载内容
            if (params.downloadUrl) {
                const response = await firstValueFrom(
                    this.httpService.get(params.downloadUrl, {
                        responseType: 'text',
                        timeout: 30000
                    })
                );
                return response.data;
            }

            return null;
        } catch (error) {
            this.logger.error('获取摘要文件内容失败', error.stack);
            return null;
        }
    }

    /**
     * 处理摘要内容
     */
    private async processSummaryContent(content: string, mimeType: string): Promise<string> {
        switch (mimeType) {
            case 'text/markdown':
                return this.processMarkdownContent(content);
            case 'text/html':
                return this.processHTMLContent(content);
            case 'application/json':
                return this.processJSONContent(content);
            case 'text/xml':
            case 'application/xml':
                return this.processXMLContent(content);
            case 'text/plain':
            default:
                return this.processPlainTextContent(content);
        }
    }

    /**
     * 处理Markdown格式摘要
     */
    private processMarkdownContent(content: string): string {
        // 保留Markdown格式，只做基本清理
        return content.trim();
    }

    /**
     * 处理HTML格式摘要
     */
    private processHTMLContent(content: string): string {
        // 移除HTML标签，保留文本内容
        return content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 处理JSON格式摘要
     */
    private processJSONContent(content: string): string {
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
     * 处理XML格式摘要
     */
    private processXMLContent(content: string): string {
        // 简单的XML文本提取，移除所有标签
        return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * 处理纯文本摘要
     */
    private processPlainTextContent(content: string): string {
        // 清理多余的空白字符
        return content.replace(/\s+/g, ' ').trim();
    }

    /**
     * 提取结构化信息
     */
    private async extractStructuredInfo(content: string): Promise<{
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

        // 匹配关键词
        const keywords = content.match(/\b[\u4e00-\u9fff]{2,8}\b/g);
        if (keywords) {
            // 简单的关键词频率分析
            const frequency: Record<string, number> = {};
            keywords.forEach(keyword => {
                frequency[keyword] = (frequency[keyword] || 0) + 1;
            });

            const sortedKeywords = Object.entries(frequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([keyword]) => keyword);

            topics.push(...sortedKeywords);
        }

        return [...new Set(topics)].slice(0, 10);
    }

    /**
     * 从MIME类型获取格式
     */
    private getFormatFromMimeType(mimeType: string): string {
        const formatMap: Record<string, string> = {
            'text/plain': 'TXT',
            'text/markdown': 'MD',
            'text/html': 'HTML',
            'application/json': 'JSON',
            'text/xml': 'XML',
            'application/xml': 'XML'
        };

        return formatMap[mimeType] || 'UNKNOWN';
    }

    /**
     * 统计单词数
     */
    private countWords(text: string): number {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * 检测语言
     */
    private async detectLanguage(text: string): Promise<string> {
        // 简单的语言检测逻辑
        const chineseRegex = /[\u4e00-\u9fff]/;
        const englishRegex = /[a-zA-Z]/;

        if (chineseRegex.test(text)) {
            return 'zh';
        } else if (englishRegex.test(text)) {
            return 'en';
        }

        return 'unknown';
    }
}