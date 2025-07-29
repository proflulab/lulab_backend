import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { TextAnalysisUtil } from '../utils/text-analysis.util';
import { TextFileProcessor } from './text-processor.base';

/**
 * 转录文件处理器
 */
@Injectable()
export class TranscriptProcessor extends TextFileProcessor {
    protected readonly logger = new Logger(TranscriptProcessor.name);

    readonly supportedFileTypes: FileType[] = [FileType.TRANSCRIPT];
    readonly supportedMimeTypes: string[] = [
        'text/plain',
        'text/vtt',
        'text/srt',
        'application/json',
        'text/xml',
        'application/xml'
    ];

    constructor(httpService: HttpService) {
        super(httpService);
    }

    protected getTextType(): string {
        return '转录';
    }

    protected async getSpecificMetadata(content: string): Promise<any> {
        return {
            estimatedDuration: TextAnalysisUtil.estimateSpeechDuration(content)
        };
    }

    getName(): string {
        return 'TranscriptProcessor';
    }

    /**
     * 处理转录内容
     */
    protected async processTextContent(content: string, mimeType: string): Promise<string> {
        switch (mimeType) {
            case 'text/vtt':
                return this.processVTTContent(content);
            case 'text/srt':
                return this.processSRTContent(content);
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
     * 处理VTT格式内容
     */
    protected processVTTContent(content: string): string {
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
     * 处理SRT格式内容
     */
    protected processSRTContent(content: string): string {
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
     * 处理JSON格式内容
     */
    protected processJSONContent(content: string): string {
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
}