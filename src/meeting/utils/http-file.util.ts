import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

/**
 * HTTP文件工具类
 * 提供通用的HTTP文件操作方法
 */
export class HttpFileUtil {
    private static readonly logger = new Logger(HttpFileUtil.name);

    /**
     * 获取文件基本信息
     * @param httpService HTTP服务实例
     * @param url 文件URL
     * @returns 文件信息
     */
    static async getFileInfo(
        httpService: HttpService,
        url: string
    ): Promise<{
        fileSize: number | null;
        mimeType: string | null;
        contentLength: string | null;
        contentType: string | null;
    } | null> {
        try {
            const response: AxiosResponse = await firstValueFrom(
                httpService.head(url)
            );

            const contentLength = response.headers['content-length'];
            const contentType = response.headers['content-type'];

            return {
                fileSize: contentLength ? parseInt(contentLength) : null,
                mimeType: contentType,
                contentLength,
                contentType
            };
        } catch (error) {
            this.logger.error(`获取文件信息失败: ${url}`, error.stack);
            return null;
        }
    }

    /**
     * 检查文件是否可访问
     * @param httpService HTTP服务实例
     * @param url 文件URL
     * @param timeout 超时时间（毫秒）
     * @returns 是否可访问
     */
    static async isFileAccessible(
        httpService: HttpService,
        url: string,
        timeout: number = 5000
    ): Promise<boolean> {
        try {
            const response: AxiosResponse = await firstValueFrom(
                httpService.head(url, { timeout })
            );
            return response.status === 200;
        } catch (error) {
            this.logger.warn(`文件不可访问: ${url}`);
            return false;
        }
    }

    /**
     * 下载文件内容
     * @param httpService HTTP服务实例
     * @param url 文件URL
     * @param maxSize 最大文件大小（字节）
     * @returns 文件内容
     */
    static async downloadFileContent(
        httpService: HttpService,
        url: string,
        maxSize: number = 10 * 1024 * 1024 // 10MB
    ): Promise<string | null> {
        try {
            // 先检查文件大小
            const fileInfo = await this.getFileInfo(httpService, url);
            if (fileInfo?.fileSize && fileInfo.fileSize > maxSize) {
                this.logger.warn(`文件过大，跳过下载: ${url}, 大小: ${fileInfo.fileSize}`);
                return null;
            }

            const response: AxiosResponse = await firstValueFrom(
                httpService.get(url, {
                    responseType: 'text',
                    maxContentLength: maxSize
                })
            );

            return response.data;
        } catch (error) {
            this.logger.error(`下载文件内容失败: ${url}`, error.stack);
            return null;
        }
    }
}