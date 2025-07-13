import { FileType, ProcessingStatus } from '@prisma/client';

/**
 * 文件处理结果
 */
export interface FileProcessingResult {
    success: boolean;
    content?: string;
    metadata?: any;
    error?: string;
    processingStatus: ProcessingStatus;
}

/**
 * 文件处理参数
 */
export interface FileProcessingParams {
    fileId: string;
    fileName: string;
    fileType: FileType;
    downloadUrl?: string;
    content?: string;
    mimeType: string;
    meetingRecordId: string;
    metadata?: any;
}

/**
 * 文件处理器接口
 */
export interface IFileProcessor {
    /**
     * 支持的文件类型
     */
    readonly supportedFileTypes: FileType[];

    /**
     * 支持的MIME类型
     */
    readonly supportedMimeTypes: string[];

    /**
     * 检查是否支持该文件类型
     */
    canProcess(fileType: FileType, mimeType: string): boolean;

    /**
     * 处理文件
     */
    process(params: FileProcessingParams): Promise<FileProcessingResult>;

    /**
     * 验证文件
     */
    validate(params: FileProcessingParams): Promise<boolean>;

    /**
     * 获取处理器名称
     */
    getName(): string;

    /**
     * 获取处理器版本
     */
    getVersion(): string;
}

/**
 * 文件处理器工厂接口
 */
export interface IFileProcessorFactory {
    /**
     * 获取文件处理器
     */
    getProcessor(fileType: FileType, mimeType: string): IFileProcessor | null;

    /**
     * 注册文件处理器
     */
    registerProcessor(processor: IFileProcessor): void;

    /**
     * 获取所有处理器
     */
    getAllProcessors(): IFileProcessor[];

    /**
     * 获取支持的文件类型
     */
    getSupportedFileTypes(): FileType[];
}

/**
 * 抽象文件处理器基类
 */
export abstract class BaseFileProcessor implements IFileProcessor {
    abstract readonly supportedFileTypes: FileType[];
    abstract readonly supportedMimeTypes: string[];

    canProcess(fileType: FileType, mimeType: string): boolean {
        return this.supportedFileTypes.includes(fileType) && 
               this.supportedMimeTypes.includes(mimeType);
    }

    abstract process(params: FileProcessingParams): Promise<FileProcessingResult>;

    async validate(params: FileProcessingParams): Promise<boolean> {
        // 基础验证
        if (!params.fileId || !params.fileName || !params.fileType) {
            return false;
        }

        // 检查文件类型支持
        if (!this.canProcess(params.fileType, params.mimeType)) {
            return false;
        }

        // 检查是否有下载URL或内容
        if (!params.downloadUrl && !params.content) {
            return false;
        }

        return true;
    }

    abstract getName(): string;
    abstract getVersion(): string;

    /**
     * 创建成功结果
     */
    protected createSuccessResult(
        content?: string, 
        metadata?: any
    ): FileProcessingResult {
        return {
            success: true,
            content,
            metadata,
            processingStatus: ProcessingStatus.COMPLETED
        };
    }

    /**
     * 创建失败结果
     */
    protected createErrorResult(
        error: string, 
        processingStatus: ProcessingStatus = ProcessingStatus.FAILED
    ): FileProcessingResult {
        return {
            success: false,
            error,
            processingStatus
        };
    }

    /**
     * 创建处理中结果
     */
    protected createProcessingResult(): FileProcessingResult {
        return {
            success: true,
            processingStatus: ProcessingStatus.PROCESSING
        };
    }
}