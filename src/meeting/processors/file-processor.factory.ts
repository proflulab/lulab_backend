import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';
import { IFileProcessor, IFileProcessorFactory } from './file-processor.interface';
import { VideoProcessor } from './video-processor';
import { AudioProcessor } from './audio-processor';
import { TranscriptProcessor } from './transcript-processor';
import { SummaryProcessor } from './summary-processor';

/**
 * 文件处理器工厂类
 * 负责管理和提供文件处理器实例
 */
@Injectable()
export class FileProcessorFactory implements IFileProcessorFactory {
    private readonly logger = new Logger(FileProcessorFactory.name);
    private readonly processors = new Map<string, IFileProcessor>();
    private readonly fileTypeProcessors = new Map<FileType, IFileProcessor[]>();

    constructor(
        private readonly videoProcessor: VideoProcessor,
        private readonly audioProcessor: AudioProcessor,
        private readonly transcriptProcessor: TranscriptProcessor,
        private readonly summaryProcessor: SummaryProcessor
    ) {
        this.initializeProcessors();
    }

    /**
     * 初始化处理器
     */
    private initializeProcessors(): void {
        // 注册所有处理器
        this.registerProcessor(this.videoProcessor);
        this.registerProcessor(this.audioProcessor);
        this.registerProcessor(this.transcriptProcessor);
        this.registerProcessor(this.summaryProcessor);

        this.logger.log(`已注册 ${this.processors.size} 个文件处理器`);
    }

    /**
     * 获取文件处理器
     * @param fileType 文件类型
     * @param mimeType MIME类型
     * @returns 匹配的处理器或null
     */
    getProcessor(fileType: FileType, mimeType: string): IFileProcessor | null {
        const processors = this.fileTypeProcessors.get(fileType);
        if (!processors || processors.length === 0) {
            this.logger.warn(`没有找到文件类型 ${fileType} 的处理器`);
            return null;
        }

        // 查找支持该MIME类型的处理器
        const matchingProcessor = processors.find(processor =>
            processor.canProcess(fileType, mimeType)
        );

        if (!matchingProcessor) {
            this.logger.warn(`没有找到支持 ${fileType}/${mimeType} 的处理器`);
            return null;
        }

        this.logger.debug(`为 ${fileType}/${mimeType} 找到处理器: ${matchingProcessor.getName()}`);
        return matchingProcessor;
    }

    /**
     * 注册文件处理器
     * @param processor 处理器实例
     */
    registerProcessor(processor: IFileProcessor): void {
        const processorKey = `${processor.getName()}_${processor.getVersion()}`;

        if (this.processors.has(processorKey)) {
            this.logger.warn(`处理器 ${processorKey} 已存在，将被覆盖`);
        }

        this.processors.set(processorKey, processor);

        // 为每个支持的文件类型注册处理器
        processor.supportedFileTypes.forEach(fileType => {
            if (!this.fileTypeProcessors.has(fileType)) {
                this.fileTypeProcessors.set(fileType, []);
            }

            const typeProcessors = this.fileTypeProcessors.get(fileType)!;

            // 避免重复注册
            if (!typeProcessors.includes(processor)) {
                typeProcessors.push(processor);
            }
        });

        this.logger.log(`已注册处理器: ${processor.getName()} v${processor.getVersion()}`);
    }

    /**
     * 获取所有处理器
     * @returns 所有处理器数组
     */
    getAllProcessors(): IFileProcessor[] {
        return Array.from(this.processors.values());
    }

    /**
     * 获取支持的文件类型
     * @returns 支持的文件类型数组
     */
    getSupportedFileTypes(): FileType[] {
        return Array.from(this.fileTypeProcessors.keys());
    }

    /**
     * 获取指定文件类型的所有处理器
     * @param fileType 文件类型
     * @returns 处理器数组
     */
    getProcessorsByFileType(fileType: FileType): IFileProcessor[] {
        return this.fileTypeProcessors.get(fileType) || [];
    }

    /**
     * 获取处理器信息
     * @returns 处理器信息对象
     */
    getProcessorInfo(): {
        totalProcessors: number;
        supportedFileTypes: FileType[];
        processors: Array<{
            name: string;
            version: string;
            supportedFileTypes: FileType[];
            supportedMimeTypes: string[];
        }>;
    } {
        const processors = this.getAllProcessors();

        return {
            totalProcessors: processors.length,
            supportedFileTypes: this.getSupportedFileTypes(),
            processors: processors.map(processor => ({
                name: processor.getName(),
                version: processor.getVersion(),
                supportedFileTypes: processor.supportedFileTypes,
                supportedMimeTypes: processor.supportedMimeTypes
            }))
        };
    }

    /**
     * 检查是否支持指定的文件类型和MIME类型
     * @param fileType 文件类型
     * @param mimeType MIME类型
     * @returns 是否支持
     */
    isSupported(fileType: FileType, mimeType: string): boolean {
        return this.getProcessor(fileType, mimeType) !== null;
    }

    /**
     * 移除处理器
     * @param processorName 处理器名称
     * @param version 处理器版本
     */
    unregisterProcessor(processorName: string, version: string): boolean {
        const processorKey = `${processorName}_${version}`;
        const processor = this.processors.get(processorKey);

        if (!processor) {
            this.logger.warn(`处理器 ${processorKey} 不存在`);
            return false;
        }

        // 从主映射中移除
        this.processors.delete(processorKey);

        // 从文件类型映射中移除
        processor.supportedFileTypes.forEach(fileType => {
            const typeProcessors = this.fileTypeProcessors.get(fileType);
            if (typeProcessors) {
                const index = typeProcessors.indexOf(processor);
                if (index > -1) {
                    typeProcessors.splice(index, 1);
                }

                // 如果该文件类型没有处理器了，移除映射
                if (typeProcessors.length === 0) {
                    this.fileTypeProcessors.delete(fileType);
                }
            }
        });

        this.logger.log(`已移除处理器: ${processorKey}`);
        return true;
    }

    /**
     * 清空所有处理器
     */
    clearAllProcessors(): void {
        this.processors.clear();
        this.fileTypeProcessors.clear();
        this.logger.log('已清空所有处理器');
    }
}