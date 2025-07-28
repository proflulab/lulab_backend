import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseFileProcessor, FileProcessingParams, FileProcessingResult } from './file-processor.interface';
import { HttpFileUtil } from '../utils/http-file.util';

/**
 * 媒体文件处理器基类
 * 为音频和视频处理器提供通用功能
 */
export abstract class MediaFileProcessor extends BaseFileProcessor {
    protected abstract readonly logger: Logger;

    constructor(protected readonly httpService: HttpService) {
        super();
    }

    async process(params: FileProcessingParams): Promise<FileProcessingResult> {
        try {
            this.logger.log(`开始处理${this.getMediaType()}文件: ${params.fileName}`);

            // 验证参数
            if (!await this.validate(params)) {
                return this.createErrorResult(`${this.getMediaType()}文件参数验证失败`);
            }

            // 获取文件信息
            const mediaInfo = await this.getMediaInfo(params);
            if (!mediaInfo) {
                return this.createErrorResult(`无法获取${this.getMediaType()}文件信息`);
            }

            // 处理媒体元数据
            const metadata = {
                ...mediaInfo,
                processedAt: new Date().toISOString()
            };

            this.logger.log(`${this.getMediaType()}文件处理完成: ${params.fileName}`);
            return this.createSuccessResult(undefined, metadata);

        } catch (error) {
            this.logger.error(`${this.getMediaType()}文件处理失败: ${params.fileName}`, error.stack);
            return this.createErrorResult(`${this.getMediaType()}文件处理失败: ${error.message}`);
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
            this.logger.warn(`不支持的${this.getMediaType()}MIME类型: ${params.mimeType}`);
            return false;
        }

        return true;
    }

    /**
     * 获取媒体文件信息
     */
    protected async getMediaInfo(params: FileProcessingParams): Promise<any> {
        try {
            if (params.downloadUrl) {
                // 通过HTTP获取文件信息
                const fileInfo = await HttpFileUtil.getFileInfo(
                    this.httpService,
                    params.downloadUrl
                );

                if (!fileInfo) {
                    return null;
                }

                return {
                    fileSize: fileInfo.fileSize,
                    mimeType: fileInfo.mimeType,
                    duration: null, // 需要额外的媒体分析工具来获取
                    ...this.getMediaSpecificInfo(fileInfo.mimeType || params.mimeType)
                };
            }

            // 如果没有下载URL，返回基本信息
            return {
                fileSize: null,
                mimeType: params.mimeType,
                duration: null,
                ...this.getMediaSpecificInfo(params.mimeType)
            };

        } catch (error) {
            this.logger.error(`获取${this.getMediaType()}文件信息失败`, error.stack);
            return null;
        }
    }

    /**
     * 检查媒体文件是否可访问
     */
    protected async isMediaAccessible(url: string): Promise<boolean> {
        return HttpFileUtil.isFileAccessible(this.httpService, url, 5000);
    }

    /**
     * 获取媒体类型名称（用于日志）
     */
    protected abstract getMediaType(): string;

    /**
     * 获取媒体特定信息
     */
    protected abstract getMediaSpecificInfo(mimeType: string): any;

    getVersion(): string {
        return '1.0.0';
    }
}