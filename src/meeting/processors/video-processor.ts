import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { MediaFileProcessor } from './media-processor.base';

/**
 * 视频文件处理器
 */
@Injectable()
export class VideoProcessor extends MediaFileProcessor {
    protected readonly logger = new Logger(VideoProcessor.name);

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

    constructor(httpService: HttpService) {
        super(httpService);
    }

    protected getMediaType(): string {
        return '视频';
    }

    protected getMediaSpecificInfo(mimeType: string): any {
        return {
            resolution: null,
            codec: null,
            bitrate: null,
            frameRate: null
        };
    }

    getName(): string {
        return 'VideoProcessor';
    }

    /**
     * 获取视频缩略图（如果需要的话）
     */
    async generateThumbnail(fileName: string): Promise<string | null> {
        // 这里可以集成视频处理库来生成缩略图
        // 例如使用 ffmpeg 或其他视频处理服务
        this.logger.log(`生成视频缩略图: ${fileName}`);
        return null;
    }

    /**
     * 检查视频文件是否可访问
     */
    async checkVideoAccessibility(url: string): Promise<boolean> {
        return this.isMediaAccessible(url);
    }
}