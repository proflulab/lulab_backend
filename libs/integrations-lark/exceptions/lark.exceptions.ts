import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export class LarkClientNotConfiguredException extends InternalServerErrorException {
    constructor(message = 'Lark client is not properly configured') {
        super(message);
    }
}

export class LarkApiException extends BadRequestException {
    constructor(message: string, code?: number) {
        super(`Lark API Error: ${message}${code ? ` (Code: ${code})` : ''}`);
    }
}

export class BitableRecordCreationException extends BadRequestException {
    constructor(appToken: string, tableId: string, error?: string) {
        super(`Failed to create Bitable record in app ${appToken}, table ${tableId}${error ? `: ${error}` : ''}`);
    }
}

export class InvalidFieldException extends BadRequestException {
    constructor(fieldName: string, fieldValue: any) {
        super(`Invalid field value for '${fieldName}': ${JSON.stringify(fieldValue)}`);
    }
}