import { Injectable, Logger } from '@nestjs/common';
import { FileType, ProcessingStatus } from '@prisma/client';
import { BaseFileProcessor, FileProcessingParams, FileProcessingResult } from './file-processor.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * 音频文件处理器
 */
@Injectable()
export class AudioProcessor extends BaseFileProcessor {
    private readonly logger = new Logger(AudioProcessor.name);

    readonly supportedFileTypes: FileType[] = [FileType.AUDIO];
    readonly supportedMimeTypes: string[] = [
        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/flac',
        'audio/aac',
        'audio/ogg',
        'audio/m4a',
        'audio/wma'
    ];

    constructor(private readonly httpService: HttpService) {
        super();
    }

    async process(params: FileProcessingParams): Promise<FileProcessingResult> {
        try {
            this.logger.log(`开始处理音频文件: ${params.fileName}`);

            // 验证参数
            if (!await this.validate(params)) {
                return this.createErrorResult('音频文件参数验证失败');
            }

            // 获取音频文件信息
            const audioInfo = await this.getAudioInfo(params);
            if (!audioInfo) {
                return this.createErrorResult('无法获取音频文件信息');
            }

            // 处理音频元数据
            const metadata = {
                duration: audioInfo.duration,
                fileSize: audioInfo.fileSize,
                codec: audioInfo.codec,
                bitrate: audioInfo.bitrate,
                sampleRate: audioInfo.sampleRate,
                channels: audioInfo.channels,
                processedAt: new Date().toISOString()
            };

            this.logger.log(`音频文件处理完成: ${params.fileName}`);
            return this.createSuccessResult(undefined, metadata);

        } catch (error) {
            this.logger.error(`音频文件处理失败: ${params.fileName}`, error.stack);
            return this.createErrorResult(`音频文件处理失败: ${error.message}`);
        }
    }

    async validate(params: FileProcessingParams): Promise<boolean> {
        // 调用基类验证
        if (!await super.validate(params)) {
            return false;
        }

        // 音频文件特定验证
        if (params.fileType !== FileType.AUDIO) {
            return false;
        }

        // 检查MIME类型
        if (!this.supportedMimeTypes.includes(params.mimeType)) {
            this.logger.warn(`不支持的音频MIME类型: ${params.mimeType}`);
            return false;
        }

        return true;
    }

    getName(): string {
        return 'AudioProcessor';
    }

    getVersion(): string {
        return '1.0.0';
    }

    /**
     * 获取音频文件信息
     */
    private async getAudioInfo(params: FileProcessingParams): Promise<any> {
        try {
            if (params.downloadUrl) {
                // 通过HTTP HEAD请求获取文件信息
                const response = await firstValueFrom(
                    this.httpService.head(params.downloadUrl)
                );

                const contentLength = response.headers['content-length'];
                const contentType = response.headers['content-type'];

                return {
                    fileSize: contentLength ? parseInt(contentLength) : null,
                    mimeType: contentType,
                    duration: null, // 需要额外的音频分析工具来获取
                    codec: this.getCodecFromMimeType(contentType),
                    bitrate: null,
                    sampleRate: null,
                    channels: null
                };
            }

            // 如果没有下载URL，返回基本信息
            return {
                fileSize: null,
                mimeType: params.mimeType,
                duration: null,
                codec: this.getCodecFromMimeType(params.mimeType),
                bitrate: null,
                sampleRate: null,
                channels: null
            };

        } catch (error) {
            this.logger.error('获取音频文件信息失败', error.stack);
            return null;
        }
    }

    /**
     * 从MIME类型推断编解码器
     */
    private getCodecFromMimeType(mimeType: string): string | null {
        const codecMap: Record<string, string> = {
            'audio/mp3': 'MP3',
            'audio/mpeg': 'MP3',
            'audio/wav': 'PCM',
            'audio/flac': 'FLAC',
            'audio/aac': 'AAC',
            'audio/ogg': 'Vorbis',
            'audio/m4a': 'AAC',
            'audio/wma': 'WMA'
        };

        return codecMap[mimeType] || null;
    }

    /**
     * 检查音频文件是否可访问
     */
    private async isAudioAccessible(url: string): Promise<boolean> {
        try {
            const response = await firstValueFrom(
                this.httpService.head(url, { timeout: 5000 })
            );
            return response.status === 200;
        } catch (error) {
            this.logger.warn(`音频文件不可访问: ${url}`);
            return false;
        }
    }

    /**
     * 获取音频波形数据（如果需要的话）
     */
    private async generateWaveform(params: FileProcessingParams): Promise<number[] | null> {
        // 这里可以集成音频处理库来生成波形数据
        // 例如使用 Web Audio API 或其他音频处理服务
        this.logger.log(`生成音频波形: ${params.fileName}`);
        return null;
    }

    /**
     * 音频转录（如果需要的话）
     */
    private async transcribeAudio(params: FileProcessingParams): Promise<string | null> {
        // 这里可以集成语音识别服务
        // 例如使用 Google Speech-to-Text, Azure Speech Services 等
        this.logger.log(`音频转录: ${params.fileName}`);
        return null;
    }
}