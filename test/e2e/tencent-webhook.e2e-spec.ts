import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TencentMeetingModule } from '../../src/tencent-meeting/tencent-meeting.module';
import { verifyWebhookUrl } from '../../src/tencent-meeting/services/tencent-crypto.service';

// Mock the crypto service
jest.mock('../../src/tencent-meeting/services/tencent-crypto.service', () => ({
  verifyWebhookUrl: jest.fn(),
  verifySignature: jest.fn(),
  aesDecrypt: jest.fn(),
}));

describe('TencentWebhookController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TencentMeetingModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          const config = {
            TENCENT_MEETING_TOKEN: 'test_webhook_token',
            TENCENT_MEETING_ENCODING_AES_KEY:
              'test_encoding_aes_key_32bytes12345678',
            TENCENT_MEETING_SECRET_ID: 'test_secret_id',
            TENCENT_MEETING_SECRET_KEY: 'test_secret_key',
            TENCENT_MEETING_APP_ID: 'test_app_id',
            TENCENT_MEETING_SDK_ID: 'test_sdk_id',
          };
          return config[key];
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /webhooks/tencent', () => {
    it('should successfully verify webhook URL with valid parameters', async () => {
      const mockResponse = 'verified_response_string';
      (verifyWebhookUrl as jest.Mock).mockResolvedValue(mockResponse);

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        nonce: 'test_nonce',
        signature: 'test_signature',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(200);

      expect(response.text).toBe(mockResponse);
      expect(verifyWebhookUrl).toHaveBeenCalledWith(
        queryParams.check_str,
        queryParams.timestamp,
        queryParams.nonce,
        queryParams.signature,
        'test_webhook_token',
        'test_encoding_aes_key_32bytes12345678',
      );
    });

    it('should handle missing check_str parameter by passing undefined to verifyWebhookUrl', async () => {
      (verifyWebhookUrl as jest.Mock).mockRejectedValue(
        new Error('check_str is required'),
      );

      const queryParams = {
        timestamp: '1234567890',
        nonce: 'test_nonce',
        signature: 'test_signature',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(verifyWebhookUrl).toHaveBeenCalledWith(
        undefined,
        '1234567890',
        'test_nonce',
        'test_signature',
        'test_webhook_token',
        'test_encoding_aes_key_32bytes12345678',
      );
    });

    it('should handle missing timestamp parameter by passing undefined to verifyWebhookUrl', async () => {
      (verifyWebhookUrl as jest.Mock).mockRejectedValue(
        new Error('timestamp is required'),
      );

      const queryParams = {
        check_str: 'test_check_string',
        nonce: 'test_nonce',
        signature: 'test_signature',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(verifyWebhookUrl).toHaveBeenCalledWith(
        'test_check_string',
        undefined,
        'test_nonce',
        'test_signature',
        'test_webhook_token',
        'test_encoding_aes_key_32bytes12345678',
      );
    });

    it('should handle missing nonce parameter by passing undefined to verifyWebhookUrl', async () => {
      (verifyWebhookUrl as jest.Mock).mockRejectedValue(
        new Error('nonce is required'),
      );

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        signature: 'test_signature',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(verifyWebhookUrl).toHaveBeenCalledWith(
        'test_check_string',
        '1234567890',
        undefined,
        'test_signature',
        'test_webhook_token',
        'test_encoding_aes_key_32bytes12345678',
      );
    });

    it('should handle missing signature parameter by passing undefined to verifyWebhookUrl', async () => {
      (verifyWebhookUrl as jest.Mock).mockRejectedValue(
        new Error('signature is required'),
      );

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        nonce: 'test_nonce',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(verifyWebhookUrl).toHaveBeenCalledWith(
        'test_check_string',
        '1234567890',
        'test_nonce',
        undefined,
        'test_webhook_token',
        'test_encoding_aes_key_32bytes12345678',
      );
    });

    it('should handle verification failure from crypto service', async () => {
      (verifyWebhookUrl as jest.Mock).mockRejectedValue(
        new Error('Verification failed'),
      );

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        nonce: 'test_nonce',
        signature: 'test_signature',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(500);
    });

    it('should handle crypto service throwing custom exception', async () => {
      const customError = new Error('Invalid signature');
      customError.name = 'WebhookSignatureVerificationException';
      (verifyWebhookUrl as jest.Mock).mockRejectedValue(customError);

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        nonce: 'test_nonce',
        signature: 'invalid_signature',
      };

      const response = await request(app.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Configuration Error Handling', () => {
    it('should handle missing TENCENT_MEETING_TOKEN configuration', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          TencentMeetingModule,
        ],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            const config = {
              // Missing TENCENT_MEETING_TOKEN
              TENCENT_MEETING_ENCODING_AES_KEY: 'test_encoding_aes_key',
            };
            return config[key];
          }),
        })
        .compile();

      const tempApp = moduleRef.createNestApplication();
      await tempApp.init();

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        nonce: 'test_nonce',
        signature: 'test_signature',
      };

      const response = await request(tempApp.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body.message).toContain('TENCENT_MEETING_TOKEN');

      await tempApp.close();
    });

    it('should handle missing TENCENT_MEETING_ENCODING_AES_KEY configuration', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          TencentMeetingModule,
        ],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            const config = {
              TENCENT_MEETING_TOKEN: 'test_webhook_token',
              // Missing TENCENT_MEETING_ENCODING_AES_KEY
            };
            return config[key];
          }),
        })
        .compile();

      const tempApp = moduleRef.createNestApplication();
      await tempApp.init();

      const queryParams = {
        check_str: 'test_check_string',
        timestamp: '1234567890',
        nonce: 'test_nonce',
        signature: 'test_signature',
      };

      const response = await request(tempApp.getHttpServer())
        .get('/webhooks/tencent')
        .query(queryParams)
        .expect(500);

      expect(response.body.message).toContain(
        'TENCENT_MEETING_ENCODING_AES_KEY',
      );

      await tempApp.close();
    });
  });
});
