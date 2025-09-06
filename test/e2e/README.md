# E2E Tests for Tencent Meeting Webhook

This directory contains end-to-end tests for the Tencent Meeting Webhook integration.

## Test Coverage

### TencentWebhookController E2E Tests

The `tencent-webhook.e2e-spec.ts` file contains comprehensive tests for:

#### GET /webhooks/tencent - Webhook URL Verification

- ✅ Successful webhook URL verification with valid parameters
- ✅ Handling missing parameters (check_str, timestamp, nonce, signature)
- ✅ Verification failure scenarios
- ✅ Crypto service error handling
- ✅ Configuration error scenarios (missing environment variables)

#### POST /webhooks/tencent - Webhook Event Receiving

- Event receiving tests are covered in integration tests

## How to Run Tests

### Prerequisites

1. Ensure you have a `.env.test` file configured (copy from `.env.test.example`)
2. Install dependencies: `pnpm install`

### Run Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run only Tencent Meeting webhook tests
pnpm test:e2e -- tencent-webhook.e2e-spec.ts

# Run with the convenience script
./scripts/test-e2e.sh
```

### Test Configuration

The tests use mock values for all required environment variables:

- `TENCENT_MEETING_TOKEN`: test_webhook_token
- `TENCENT_MEETING_ENCODING_AES_KEY`: test_encoding_aes_key_32bytes12345678
- `TENCENT_MEETING_SECRET_ID`: test_secret_id
- `TENCENT_MEETING_SECRET_KEY`: test_secret_key
- `TENCENT_MEETING_APP_ID`: test_app_id
- `TENCENT_MEETING_SDK_ID`: test_sdk_id

### Test Structure

Tests are organized using Jest's describe/it blocks:

```
TencentWebhookController (e2e)
├── GET /webhooks/tencent
│   ├── should successfully verify webhook URL with valid parameters
│   ├── should handle missing check_str parameter by passing undefined to verifyWebhookUrl
│   ├── should handle missing timestamp parameter by passing undefined to verifyWebhookUrl
│   ├── should handle missing nonce parameter by passing undefined to verifyWebhookUrl
│   ├── should handle missing signature parameter by passing undefined to verifyWebhookUrl
│   ├── should handle verification failure from crypto service
│   └── should handle crypto service throwing custom exception
└── Configuration Error Handling
    ├── should handle missing TENCENT_MEETING_TOKEN configuration
    └── should handle missing TENCENT_MEETING_ENCODING_AES_KEY configuration
```

### Mocking Strategy

- **Crypto Service**: The `verifyWebhookUrl` function from `tencent-crypto.service` is mocked to avoid real cryptographic operations
- **Config Service**: Environment variables are mocked using NestJS's overrideProvider
- **Database**: Tests run without database dependencies (crypto operations are mocked)

### Error Handling Tests

The tests verify proper error handling for:

- Missing configuration values
- Invalid parameters
- Crypto verification failures
- Service layer exceptions

### Continuous Integration

These tests are designed to run in CI environments and don't require:

- Real Tencent Meeting API credentials
- Network connectivity to external services
- Database setup (when crypto is mocked)

## Adding New Tests

When adding new webhook endpoints or modifying existing ones:

1. Update the test file to cover new functionality
2. Ensure all error scenarios are tested
3. Add configuration validation tests for new environment variables
4. Update this README if test structure changes significantly
