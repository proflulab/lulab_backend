import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TencentWebhookController } from './tencent-webhook.controller';
import { TencentEventHandlerFactory } from '../services/handlers/event-handler-factory';
import * as tencentCryptoService from '../services/tencent-crypto.service';

// Mock the crypto service
jest.mock('../services/tencent-crypto.service');

describe('TencentWebhookController', () => {
  let controller: TencentWebhookController;
  let configService: ConfigService;
  let tencentEventHandlerFactory: TencentEventHandlerFactory;
  let mockVerifyWebhookUrl: jest.MockedFunction<typeof tencentCryptoService.verifyWebhookUrl>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock for verifyWebhookUrl
    mockVerifyWebhookUrl = tencentCryptoService.verifyWebhookUrl as jest.MockedFunction<typeof tencentCryptoService.verifyWebhookUrl>;

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
          provide: TencentEventHandlerFactory,
          useValue: {
            handleDecryptedEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TencentWebhookController>(TencentWebhookController);
    configService = module.get<ConfigService>(ConfigService);
    tencentEventHandlerFactory = module.get<TencentEventHandlerFactory>(TencentEventHandlerFactory);

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
      (configService.get as jest.Mock)
        .mockReturnValueOnce(mockConfig.token)
        .mockReturnValueOnce(mockConfig.encodingAesKey);
      const expectedResult = 'decrypted_check_str';
      mockVerifyWebhookUrl.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature
      );

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockVerifyWebhookUrl).toHaveBeenCalledWith(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
        mockConfig.token,
        mockConfig.encodingAesKey
      );
      expect(configService.get).toHaveBeenCalledWith('TENCENT_MEETING_TOKEN');
      expect(configService.get).toHaveBeenCalledWith('TENCENT_MEETING_ENCODING_AES_KEY');
    });

    it('should use empty string as default when config values are undefined', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);
      const expectedResult = 'decrypted_check_str';
      mockVerifyWebhookUrl.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature
      );

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockVerifyWebhookUrl).toHaveBeenCalledWith(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
        '', // empty string as default
        ''  // empty string as default
      );
    });

    it('should log the webhook verification request', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce(mockConfig.token)
        .mockReturnValueOnce(mockConfig.encodingAesKey);
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      mockVerifyWebhookUrl.mockResolvedValue('test_result');

      // Act
      await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature
      );

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Received Tencent Meeting Webhook URL verification request');
    });

    it('should log error and re-throw when verifyWebhookUrl fails', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce(mockConfig.token)
        .mockReturnValueOnce(mockConfig.encodingAesKey);
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
          mockParams.signature
        )
      ).rejects.toThrow(errorMessage);

      expect(logSpy).toHaveBeenCalledWith(
        'Failed to handle Tencent Meeting Webhook URL verification',
        error.stack
      );
    });

    it('should handle missing config values gracefully', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null);
      const expectedResult = 'decrypted_check_str';
      mockVerifyWebhookUrl.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature
      );

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockVerifyWebhookUrl).toHaveBeenCalledWith(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature,
        '', // null converted to empty string
        ''  // null converted to empty string
      );
    });

    it('should call verifyWebhookUrl with correct parameters in correct order', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce(mockConfig.token)
        .mockReturnValueOnce(mockConfig.encodingAesKey);
      mockVerifyWebhookUrl.mockResolvedValue('test_result');

      // Act
      await controller.verifyTencentWebhook(
        mockParams.checkStr,
        mockParams.timestamp,
        mockParams.nonce,
        mockParams.signature
      );

      // Assert
      expect(mockVerifyWebhookUrl).toHaveBeenCalledTimes(1);
      expect(mockVerifyWebhookUrl).toHaveBeenCalledWith(
        mockParams.checkStr,    // checkStr
        mockParams.timestamp,   // timestamp
        mockParams.nonce,       // nonce
        mockParams.signature,   // signature
        mockConfig.token,       // token
        mockConfig.encodingAesKey // encodingAesKey
      );
    });
  });
});