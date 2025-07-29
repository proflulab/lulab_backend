import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseFileProcessor, FileProcessingParams, FileProcessingResult } from './file-processor.interface';
import { TextAnalysisUtil } from '../utils/text-analysis.util';
import { HttpFileUtil } from '../utils/http-file.util';

/**
 * 文本文件处理器基类
 * 为转录和摘要处理器提供通用功能
 */
export abstract class TextFileProcessor extends BaseFileProcessor {
    protected abstract readonly logger: Logger;

    constructor(protected readonly httpService: HttpService) {
        super();
    }

    async process(params: FileProcessingParams): Promise<FileProcessingResult> {
        try {
            this.logger.log(`开始处理${this.getTextType()}文件: ${params.fileName}`);

            // 验证参数
            if (!await this.validate(params)) {
                return this.createErrorResult(`${this.getTextType()}文件参数验证失败`);
            }

            // 获取文本内容
            const textContent = await this.getTextContent(params);
            if (!textContent) {
                return this.createErrorResult(`无法获取${this.getTextType()}文件内容`);
            }

            // 处理文本内容
            const processedContent = await this.processTextContent(
                textContent,
                params.mimeType
            );

            // 生成基础元数据
            const baseMetadata = {
                originalFormat: this.getFormatFromMimeType(params.mimeType),
                wordCount: TextAnalysisUtil.countWords(processedContent),
                characterCount: TextAnalysisUtil.countCharacters(processedContent),
                language: TextAnalysisUtil.detectLanguage(processedContent),
                processedAt: new Date().toISOString()
            };

            // 获取特定类型的元数据
            const specificMetadata = await this.getSpecificMetadata(processedContent);
            const metadata = { ...baseMetadata, ...specificMetadata };

            this.logger.log(`${this.getTextType()}文件处理完成: ${params.fileName}`);
            return this.createSuccessResult(processedContent, metadata);

        } catch (error) {
            this.logger.error(`${this.getTextType()}文件处理失败: ${params.fileName}`, error.stack);
            return this.createErrorResult(`${this.getTextType()}文件处理失败: ${error.message}`);
        }
    }

    async validate(params: FileProcessingParams): Promise<boolean> {
        // 调用基类验证
        if (!await super.validate(params)) {
            return false;
        }

        // 检查文件类型
        if (!this.supportedFileTypes.includes(params.fileType)) {
            return false;
        }

        // 检查MIME类型
        if (!this.supportedMimeTypes.includes(params.mimeType)) {
            this.logger.warn(`不支持的${this.getTextType()}MIME类型: ${params.mimeType}`);
            return false;
        }

        return true;
    }

    /**
     * 获取文本文件内容
     */
    protected async getTextContent(params: FileProcessingParams): Promise<string | null> {
        try {
            // 如果已有内容，直接返回
            if (params.content) {
                return params.content;
            }

            // 从URL下载内容
            if (params.downloadUrl) {
                return await HttpFileUtil.downloadFileContent(
                    this.httpService,
                    params.downloadUrl,
                    5 * 1024 * 1024 // 5MB 限制
                );
            }

            return null;
        } catch (error) {
            this.logger.error(`获取${this.getTextType()}文件内容失败`, error.stack);
            return null;
        }
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
            if (data.summary) {
                return data.summary;
            }
            if (Array.isArray(data)) {
                return data.map(item => item.text || item.content || '').join(' ');
            }

            return JSON.stringify(data);
        } catch (error) {
            this.logger.warn(`JSON${this.getTextType()}内容解析失败，作为纯文本处理`);
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
     * 从MIME类型获取格式名称
     */
    protected getFormatFromMimeType(mimeType: string): string {
        const formatMap: Record<string, string> = {
            'text/plain': 'Plain Text',
            'text/vtt': 'WebVTT',
            'text/srt': 'SubRip',
            'text/markdown': 'Markdown',
            'text/html': 'HTML',
            'application/json': 'JSON',
            'text/xml': 'XML',
            'application/xml': 'XML'
        };

        return formatMap[mimeType] || 'Unknown';
    }

    /**
     * 获取文本类型名称（用于日志）
     */
    protected abstract getTextType(): string;

    /**
     * 处理文本内容（由子类实现具体逻辑）
     */
    protected abstract processTextContent(content: string, mimeType: string): Promise<string>;

    /**
     * 获取特定类型的元数据（由子类实现）
     */
    protected abstract getSpecificMetadata(content: string): Promise<any>;

    getVersion(): string {
        return '1.0.0';
    }
}