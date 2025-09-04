#!/usr/bin/env node

/**
 * 腾讯会议API验证脚本
 * 
 * 使用方法：
 * 1. 复制 .env.test.example 为 .env.test
 * 2. 填入真实的测试配置
 * 3. 运行：npm run validate:tencent-api
 * 
 * 此脚本将验证：
 * - API认证是否正常
 * - 响应结构是否符合预期
 * - 网络连接是否畅通
 * - IP白名单是否配置正确
 */

try {
  require('dotenv').config({ path: '.env.test' });
} catch (error) {
  console.error('Failed to load dotenv:', error);
  process.exit(1);
}

import { ConfigService } from '@nestjs/config';
import { TencentApiService } from '../src/tencent-meeting/services/tencent-api.service';

interface ValidationResult {
  endpoint: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  responseTime?: number;
  error?: string;
  data?: any;
}

class TencentApiValidator {
  private service: TencentApiService;
  private configService: ConfigService;
  private results: ValidationResult[] = [];

  constructor() {
    this.configService = new ConfigService();
    this.service = new TencentApiService(this.configService);
  }

  async validate(): Promise<void> {
    console.log('🚀 Starting Tencent Meeting API Validation...\n');

    // 验证配置
    if (!this.validateConfig()) {
      return;
    }

    // 验证各个端点
    await this.validateCorpRecords();

    // 如果有测试文件ID，验证录制详情
    if (process.env.TEST_RECORDING_FILE_ID) {
      await this.validateRecordingFileDetail();
    } else {
      this.results.push({
        endpoint: 'getRecordingFileDetail',
        status: 'skipped',
        message: '跳过录制详情验证（未设置 TEST_RECORDING_FILE_ID）'
      });
    }

    // 输出结果汇总
    this.printResults();
  }

  private validateConfig(): boolean {
    console.log('📋 Validating configuration...');

    const requiredVars = [
      'TENCENT_MEETING_SECRET_ID',
      'TENCENT_MEETING_SECRET_KEY',
      'TENCENT_MEETING_APP_ID',
      'TENCENT_MEETING_SDK_ID',
      'USER_ID'
    ];

    const missing = requiredVars.filter(varName => !this.configService.get(varName));

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(varName => console.error(`   - ${varName}`));
      console.error('\n请复制 .env.test.example 为 .env.test 并填入配置');
      return false;
    }

    console.log('✅ Configuration validated\n');
    return true;
  }

  private async validateCorpRecords(): Promise<void> {
    console.log('🔍 Validating /v1/corp/records endpoint...');

    const startTime = Math.floor(Date.now() / 1000) - 24 * 60 * 60; // 24小时前
    const endTime = Math.floor(Date.now() / 1000);

    const start = Date.now();

    try {
      const result = await this.service.getCorpRecords(startTime, endTime, 5, 1);
      const responseTime = Date.now() - start;

      this.results.push({
        endpoint: 'getCorpRecords',
        status: 'success',
        message: `获取到 ${result.total_count} 条会议记录`,
        responseTime,
        data: {
          totalCount: result.total_count,
          currentPage: result.current_page,
          totalPage: result.total_page,
          meetingsCount: result.record_meetings?.length || 0,
          firstMeeting: result.record_meetings?.[0] || null
        }
      });

      console.log(`✅ Success: ${result.total_count} records found (${responseTime}ms)`);

      // 验证响应结构
      this.validateResponseStructure(result, 'RecordMeetingsResponse');

    } catch (error: any) {
      const responseTime = Date.now() - start;

      this.results.push({
        endpoint: 'getCorpRecords',
        status: 'error',
        message: this.getErrorMessage(error),
        responseTime,
        error: error.message
      });

      console.error(`❌ Error: ${this.getErrorMessage(error)} (${responseTime}ms)`);
    }
  }

  private async validateRecordingFileDetail(): Promise<void> {
    const fileId = process.env.TEST_RECORDING_FILE_ID!;
    const userId = this.configService.get<string>('USER_ID')!;

    console.log(`🔍 Validating /v1/addresses endpoint with file: ${fileId}...`);

    const start = Date.now();

    try {
      const result = await this.service.getRecordingFileDetail(fileId, userId);
      const responseTime = Date.now() - start;

      this.results.push({
        endpoint: 'getRecordingFileDetail',
        status: 'success',
        message: '录制详情获取成功',
        responseTime,
        data: {
          recordFileId: result.record_file_id,
          meetingId: result.meeting_id,
          meetingCode: result.meeting_code,
          hasDownloadAddress: !!result.download_address,
          hasViewAddress: !!result.view_address
        }
      });

      console.log(`✅ Success: Recording details retrieved (${responseTime}ms)`);

      // 验证响应结构
      this.validateResponseStructure(result, 'RecordingDetail');

    } catch (error: any) {
      const responseTime = Date.now() - start;

      this.results.push({
        endpoint: 'getRecordingFileDetail',
        status: 'error',
        message: this.getErrorMessage(error),
        responseTime,
        error: error.message
      });

      console.error(`❌ Error: ${this.getErrorMessage(error)} (${responseTime}ms)`);
    }
  }

  private getErrorMessage(error: any): string {
    if (error.response) {
      // API响应错误
      const status = error.response.status;
      const data = error.response.data;

      if (data && data.error_msg) {
        return `API错误: ${data.error_msg} (状态码: ${status})`;
      } else if (data && data.message) {
        return `API错误: ${data.message} (状态码: ${status})`;
      } else {
        return `HTTP错误: 状态码 ${status}`;
      }
    } else if (error.request) {
      // 网络错误
      return `网络错误: ${error.message || '无法连接到腾讯会议API'}`;
    } else if (error.message) {
      // 其他错误
      return `错误: ${error.message}`;
    } else {
      // 未知错误
      return `未知错误: ${String(error)}`;
    }
  }

  private validateResponseStructure(data: any, type: string): void {
    console.log(`   📊 Validating ${type} structure...`);

    switch (type) {
      case 'RecordMeetingsResponse':
        this.validateRecordMeetingsResponse(data);
        break;
      case 'RecordingDetail':
        this.validateRecordingDetail(data);
        break;
    }
  }

  private validateRecordMeetingsResponse(data: any): void {
    const requiredFields = ['total_count', 'current_page', 'total_page'];
    const missing = requiredFields.filter(field => !(field in data));

    if (missing.length > 0) {
      console.warn(`   ⚠️ Missing fields: ${missing.join(', ')}`);
    } else {
      console.log('   ✅ Structure validated');
    }

    if (data.record_meetings && data.record_meetings.length > 0) {
      const first = data.record_meetings[0];
      const meetingFields = ['meeting_record_id', 'meeting_id', 'subject'];
      const missingMeetingFields = meetingFields.filter(field => !(field in first));

      if (missingMeetingFields.length > 0) {
        console.warn(`   ⚠️ Meeting missing fields: ${missingMeetingFields.join(', ')}`);
      }
    }
  }

  private validateRecordingDetail(data: any): void {
    const requiredFields = ['record_file_id', 'meeting_id', 'meeting_code'];
    const missing = requiredFields.filter(field => !(field in data));

    if (missing.length > 0) {
      console.warn(`   ⚠️ Missing fields: ${missing.join(', ')}`);
    } else {
      console.log('   ✅ Structure validated');
    }
  }

  private printResults(): void {
    console.log('\n📊 Validation Results Summary:');
    console.log('='.repeat(50));

    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' :
        result.status === 'error' ? '❌' : '⏭️';
      console.log(`${icon} ${result.endpoint}: ${result.message}`);

      if (result.responseTime) {
        console.log(`   Response time: ${result.responseTime}ms`);
      }

      if (result.data) {
        console.log(`   Data:`, JSON.stringify(result.data, null, 2));
      }

      if (result.error && result.status === 'error') {
        console.log(`   Error: ${result.error}`);
      }

      console.log('');
    });

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const skippedCount = this.results.filter(r => r.status === 'skipped').length;

    console.log('📈 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏭️ Skipped: ${skippedCount}`);

    if (errorCount > 0) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. 检查 .env.test 文件配置是否正确');
      console.log('2. 确认服务器IP已添加到腾讯会议应用白名单');
      console.log('3. 检查网络连接和防火墙设置');
      console.log('4. 确认测试用的录制文件ID是否有效');
    }
  }
}

// 运行验证
async function main() {
  const validator = new TencentApiValidator();
  await validator.validate();
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

export { TencentApiValidator };