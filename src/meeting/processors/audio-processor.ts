/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-28 14:01:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-28 17:36:23
 * @FilePath: /lulab_backend/src/meeting/processors/audio-processor.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { MediaFileProcessor } from './media-processor.base';

/**
 * 音频文件处理器
 */
@Injectable()
export class AudioProcessor extends MediaFileProcessor {
    protected readonly logger = new Logger(AudioProcessor.name);

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

    constructor(httpService: HttpService) {
        super(httpService);
    }

    protected getMediaType(): string {
        return '音频';
    }

    protected getMediaSpecificInfo(mimeType: string): any {
        return {
            codec: this.getCodecFromMimeType(mimeType),
            bitrate: null,
            sampleRate: null,
            channels: null
        };
    }

    getName(): string {
        return 'AudioProcessor';
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
}