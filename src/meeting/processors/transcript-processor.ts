import { Injectable, Logger } from '@nestjs/common';
import { FileType, ProcessingStatus } from '@prisma/client';
import { BaseFileProcessor, FileProcessingParams, FileProcessingResult } from './file-processor.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * 转录文件处理器
 */
@Injectable()
export class TranscriptProcessor extends BaseFileProcessor {
    private readonly logger = new Logger(TranscriptProcessor.name);

    readonly supportedFileTypes: FileType[] = [FileType.TRANSCRIPT];
    readonly supportedMimeTypes: string[] = [
        'text/plain',
        'text/vtt',
        'text/srt',
        'application/json',
        'text/xml',
        'application/xml'
    ];

    constructor(private readonly httpService: HttpService) {
        super();
    }

    async process(params: FileProcessingParams): Promise<FileProcessingResult> {
        try {
            this.logger.log(`开始处理转录文件: ${params.fileName}`);

            // 验证参数
            if (!await this.validate(params)) {
                return this.createErrorResult('转录文件参数验证失败');
            }

            // 获取转录内容
            const transcriptContent = await this.getTranscriptContent(params);
            if (!transcriptContent) {
                return this.createErrorResult('无法获取转录文件内容');
            }

            // 处理转录内容
            const processedContent = await this.processTranscriptContent(
                transcriptContent,
                params.mimeType
            );

            // 生成元数据
            const metadata = {
                originalFormat: this.getFormatFromMimeType(params.mimeType),
                wordCount: this.countWords(processedContent),
                characterCount: processedContent.length,
                estimatedDuration: this.estimateDuration(processedContent),
                language: await this.detectLanguage(processedContent),
                processedAt: new Date().toISOString()
            };

            this.logger.log(`转录文件处理完成: ${params.fileName}`);
            return this.createSuccessResult(processedContent, metadata);

        } catch (error) {
            this.logger.error(`转录文件处理失败: ${params.fileName}`, error.stack);
            return this.createErrorResult(`转录文件处理失败: ${error.message}`);
        }
    }

    async validate(params: FileProcessingParams): Promise<boolean> {
        // 调用基类验证
        if (!await super.validate(params)) {
            return false;
        }

        // 转录文件特定验证
        if (params.fileType !== FileType.TRANSCRIPT) {
            return false;
        }

        // 检查MIME类型
        if (!this.supportedMimeTypes.includes(params.mimeType)) {
            this.logger.warn(`不支持的转录文件MIME类型: ${params.mimeType}`);
            return false;
        }

        return true;
    }

    getName(): string {
        return 'TranscriptProcessor';
    }

    getVersion(): string {
        return '1.0.0';
    }

    /**
     * 获取转录文件内容
     */
    private async getTranscriptContent(params: FileProcessingParams): Promise<string | null> {
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
            this.logger.error('获取转录文件内容失败', error.stack);
            return null;
        }
    }

    /**
     * 处理转录内容
     */
    private async processTranscriptContent(content: string, mimeType: string): Promise<string> {
        switch (mimeType) {
            case 'text/vtt':
                return this.processVTTContent(content);
            case 'text/srt':
                return this.processSRTContent(content);
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
     * 处理VTT格式转录
     */
    private processVTTContent(content: string): string {
        // 移除VTT时间戳和格式标记，只保留文本内容
        const lines = content.split('\n');
        const textLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 跳过WEBVTT标识、时间戳行和空行
            if (line && !line.startsWith('WEBVTT') && !line.includes('-->')) {
                // 移除HTML标签
                const cleanText = line.replace(/<[^>]*>/g, '');
                if (cleanText) {
                    textLines.push(cleanText);
                }
            }
        }

        return textLines.join(' ');
    }

    /**
     * 处理SRT格式转录
     */
    private processSRTContent(content: string): string {
        // 移除SRT序号和时间戳，只保留文本内容
        const lines = content.split('\n');
        const textLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 跳过序号行、时间戳行和空行
            if (line && !line.match(/^\d+$/) && !line.includes('-->')) {
                textLines.push(line);
            }
        }

        return textLines.join(' ');
    }

    /**
     * 处理JSON格式转录
     */
    private processJSONContent(content: string): string {
        try {
            const data = JSON.parse(content);

            // 尝试不同的JSON结构
            if (data.transcript) {
                return data.transcript;
            }
            if (data.text) {
                return data.text;
            }
            if (data.content) {
                return data.content;
            }
            if (Array.isArray(data)) {
                return data.map(item => item.text || item.content || '').join(' ');
            }

            return JSON.stringify(data);
        } catch (error) {
            this.logger.warn('JSON转录内容解析失败，作为纯文本处理');
            return content;
        }
    }

    /**
     * 处理XML格式转录
     */
    private processXMLContent(content: string): string {
        // 简单的XML文本提取，移除所有标签
        return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * 处理纯文本转录
     */
    private processPlainTextContent(content: string): string {
        // 清理多余的空白字符
        return content.replace(/\s+/g, ' ').trim();
    }

    /**
     * 从MIME类型获取格式
     */
    private getFormatFromMimeType(mimeType: string): string {
        const formatMap: Record<string, string> = {
            'text/plain': 'TXT',
            'text/vtt': 'VTT',
            'text/srt': 'SRT',
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
     * 估算时长（基于平均语速）
     */
    private estimateDuration(text: string): number {
        const wordCount = this.countWords(text);
        // 假设平均语速为每分钟150个单词
        return Math.ceil(wordCount / 150);
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