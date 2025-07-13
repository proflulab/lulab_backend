import { Injectable, Logger } from '@nestjs/common';
import { FileType, ProcessingStatus } from '@prisma/client';
import { BaseFileProcessor, FileProcessingParams, FileProcessingResult } from './file-processor.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

/**
 * 视频文件处理器
 */
@Injectable()
export class VideoProcessor extends BaseFileProcessor {
    private readonly logger = new Logger(VideoProcessor.name);

    readonly supportedFileTypes: FileType[] = [FileType.VIDEO];
    readonly supportedMimeTypes: string[] = [
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/mkv'
    ];

    constructor(private readonly httpService: HttpService) {
        super();
    }

    async process(params: FileProcessingParams): Promise<FileProcessingResult> {
        try {
            this.logger.log(`开始处理视频文件: ${params.fileName}`);

            // 验证参数
            if (!await this.validate(params)) {
                return this.createErrorResult('视频文件参数验证失败');
            }

            // 获取视频文件信息
            const videoInfo = await this.getVideoInfo(params);
            if (!videoInfo) {
                return this.createErrorResult('无法获取视频文件信息');
            }

            // 处理视频元数据
            const metadata = {
                duration: videoInfo.duration,
                resolution: videoInfo.resolution,
                fileSize: videoInfo.fileSize,
                codec: videoInfo.codec,
                bitrate: videoInfo.bitrate,
                frameRate: videoInfo.frameRate,
                processedAt: new Date().toISOString()
            };

            this.logger.log(`视频文件处理完成: ${params.fileName}`);
            return this.createSuccessResult(undefined, metadata);

        } catch (error) {
            this.logger.error(`视频文件处理失败: ${params.fileName}`, error.stack);
            return this.createErrorResult(`视频文件处理失败: ${error.message}`);
        }
    }

    async validate(params: FileProcessingParams): Promise<boolean> {
        // 调用基类验证
        if (!await super.validate(params)) {
            return false;
        }

        // 视频文件特定验证
        if (params.fileType !== FileType.VIDEO) {
            return false;
        }

        // 检查MIME类型
        if (!this.supportedMimeTypes.includes(params.mimeType)) {
            this.logger.warn(`不支持的视频MIME类型: ${params.mimeType}`);
            return false;
        }

        return true;
    }

    getName(): string {
        return 'VideoProcessor';
    }

    getVersion(): string {
        return '1.0.0';
    }

    /**
     * 获取视频文件信息
     */
    private async getVideoInfo(params: FileProcessingParams): Promise<any> {
        try {
            if (params.downloadUrl) {
                // 通过HTTP HEAD请求获取文件信息
                const response: AxiosResponse = await firstValueFrom(
                    this.httpService.head(params.downloadUrl)
                );

                const contentLength = response.headers['content-length'];
                const contentType = response.headers['content-type'];

                return {
                    fileSize: contentLength ? parseInt(contentLength) : null,
                    mimeType: contentType,
                    duration: null, // 需要额外的视频分析工具来获取
                    resolution: null,
                    codec: null,
                    bitrate: null,
                    frameRate: null
                };
            }

            // 如果没有下载URL，返回基本信息
            return {
                fileSize: null,
                mimeType: params.mimeType,
                duration: null,
                resolution: null,
                codec: null,
                bitrate: null,
                frameRate: null
            };

        } catch (error) {
            this.logger.error('获取视频文件信息失败', error.stack);
            return null;
        }
    }

    /**
     * 检查视频文件是否可访问
     */
    private async isVideoAccessible(url: string): Promise<boolean> {
        try {
            const response: AxiosResponse = await firstValueFrom(
                this.httpService.head(url, { timeout: 5000 })
            );
            return response.status === 200;
        } catch (error) {
            this.logger.warn(`视频文件不可访问: ${url}`);
            return false;
        }
    }

    /**
     * 获取视频缩略图（如果需要的话）
     */
    private async generateThumbnail(params: FileProcessingParams): Promise<string | null> {
        // 这里可以集成视频处理库来生成缩略图
        // 例如使用 ffmpeg 或其他视频处理服务
        this.logger.log(`生成视频缩略图: ${params.fileName}`);
        return null;
    }
}