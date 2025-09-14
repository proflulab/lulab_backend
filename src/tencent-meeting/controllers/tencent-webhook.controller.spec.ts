import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TencentWebhookController } from './tencent-webhook.controller';
import { TencentEventHandlerService } from '../services/tencent-event-handler.service';
import { WebhookConfigException } from '@libs/integrations/tencent-meeting';
import * as tencentCryptoService from '@libs/integrations/tencent-meeting';
import { TencentMeetingConfigService } from '../services/tencent-config.service';

// Mock the crypto util
jest.mock('@libs/integrations/tencent-meeting', () => {
  const actualUnknown = jest.requireActual(
    '@libs/integrations/tencent-meeting',
  ) as unknown;
  const actual = actualUnknown as Record<string, unknown>;
  return {
    ...actual,
    verifyWebhookUrl: jest.fn(),
  } as Record<string, unknown>;
});

describe('TencentWebhookController', () => {
  let controller: TencentWebhookController;
  let tencentConfig: TencentMeetingConfigService;
  // Note: Event handler service is mocked via provider; no direct usage here
  let mockVerifyWebhookUrl: jest.MockedFunction<
    typeof tencentCryptoService.verifyWebhookUrl
  >;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock for verifyWebhookUrl
    mockVerifyWebhookUrl =
      tencentCryptoService.verifyWebhookUrl as jest.MockedFunction<
        typeof tencentCryptoService.verifyWebhookUrl
      >;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TencentWebhookController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: TencentMeetingConfigService,
          useValue: {
            getWebhookConfig: jest.fn(),
          },
        },
        {
          provide: TencentEventHandlerService,
          useValue: {
            handleEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TencentWebhookController>(TencentWebhookController);
    tencentConfig = module.get<TencentMeetingConfigService>(
      TencentMeetingConfigService,
    );
    // No direct retrieval of TencentEventHandlerService required

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  describe('verifyTencentWebhook', () => {
    const mockParams = {
      checkStr: 'test_check_str',
      timestamp: '1234567890',
      nonce: 'test_nonce',
      signature: 'test_signature',
    };

    const mockConfig = {
      token: 'test_token',
      encodingAesKey: 'test_encoding_aes_key',
    };

    // Remove the global beforeEach that was setting up config mocks

    it('should successfully verify webhook URL and return decrypted string', async () => {
      // Arrange
      const getWebhookConfigSpy = jest
        .spyOn(tencentConfig, 'getWebhookConfig')
        .mockReturnValue(mockConfig);
      const expectedResult = 'decrypted_check_str';
      mockVerifyWebhookUrl.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
      );

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockVerifyWebhookUrl).toHaveBeenCalledWith(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
        mockConfig.token,
        mockConfig.encodingAesKey,
      );
      expect(getWebhookConfigSpy).toHaveBeenCalled();
    });

    it('should throw WebhookConfigException when TENCENT_MEETING_TOKEN is undefined', async () => {
      // Arrange
      const getWebhookConfigSpy = jest
        .spyOn(tencentConfig, 'getWebhookConfig')
        .mockImplementationOnce(() => {
          throw new WebhookConfigException(
            'TENCENT_MEETING',
            'TENCENT_MEETING_TOKEN',
          );
        });

      // Act & Assert
      await expect(
        controller.verifyTencentWebhook(
          mockParams.checkStr,
          mockParams.timestamp,
          mockParams.nonce,
          mockParams.signature,
        ),
      ).rejects.toThrow(
        new WebhookConfigException('TENCENT_MEETING', 'TENCENT_MEETING_TOKEN'),
      );

      expect(getWebhookConfigSpy).toHaveBeenCalled();
      expect(mockVerifyWebhookUrl).not.toHaveBeenCalled();
    });

    it('should log the webhook verification request', async () => {
      // Arrange
      jest.spyOn(tencentConfig, 'getWebhookConfig').mockReturnValue(mockConfig);
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      mockVerifyWebhookUrl.mockResolvedValue('test_result');

      // Act
      await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
      );

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        'Received Tencent Meeting Webhook URL verification request',
      );
    });

    it('should log error and re-throw when verifyWebhookUrl fails', async () => {
      // Arrange
      (tencentConfig.getWebhookConfig as jest.Mock).mockReturnValue(mockConfig);
      const errorMessage = 'Verification failed';
      const error = new Error(errorMessage);
      const logSpy = jest.spyOn(Logger.prototype, 'error');
      mockVerifyWebhookUrl.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.verifyTencentWebhook(
          mockParams.checkStr,
          mockParams.timestamp,
          mockParams.nonce,
          mockParams.signature,
        ),
      ).rejects.toThrow(errorMessage);

      expect(logSpy).toHaveBeenCalledWith(
        'Failed to handle Tencent Meeting Webhook URL verification',
        error.stack,
      );
    });

    it('should throw WebhookConfigException when TENCENT_MEETING_ENCODING_AES_KEY is missing', async () => {
      // Arrange
      const getWebhookConfigSpy = jest
        .spyOn(tencentConfig, 'getWebhookConfig')
        .mockImplementationOnce(() => {
          throw new WebhookConfigException(
            'TENCENT_MEETING',
            'TENCENT_MEETING_ENCODING_AES_KEY',
          );
        });

      // Act & Assert
      await expect(
        controller.verifyTencentWebhook(
          mockParams.checkStr,
          mockParams.timestamp,
          mockParams.nonce,
          mockParams.signature,
        ),
      ).rejects.toThrow(
        new WebhookConfigException(
          'TENCENT_MEETING',
          'TENCENT_MEETING_ENCODING_AES_KEY',
        ),
      );

      expect(getWebhookConfigSpy).toHaveBeenCalled();
      expect(mockVerifyWebhookUrl).not.toHaveBeenCalled();
    });

    it('should call verifyWebhookUrl with correct parameters in correct order', async () => {
      // Arrange
      jest.spyOn(tencentConfig, 'getWebhookConfig').mockReturnValue(mockConfig);
      mockVerifyWebhookUrl.mockResolvedValue('test_result');

      // Act
      await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
      );

      // Assert
      expect(mockVerifyWebhookUrl).toHaveBeenCalledTimes(1);
      expect(mockVerifyWebhookUrl).toHaveBeenCalledWith(
        mockParams.checkStr, // checkStr
        mockParams.timestamp, // timestamp
        mockParams.nonce, // nonce
        mockParams.signature, // signature
        mockConfig.token, // token
        mockConfig.encodingAesKey, // encodingAesKey
      );
    });
  });
});
