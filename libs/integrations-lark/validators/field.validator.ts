import { InvalidFieldException } from '../exceptions/lark.exceptions';

/**
 * Utility functions for validating Bitable fields
 */
export class BitableFieldValidator {
    /**
     * Validate required fields are present
     */
    static validateRequiredFields(fields: Record<string, any>, requiredFields: string[]): void {
        for (const field of requiredFields) {
            if (fields[field] === undefined || fields[field] === null || fields[field] === '') {
                throw new InvalidFieldException(field, fields[field]);
            }
        }
    }

    /**
     * Validate field types
     */
    static validateFieldTypes(fields: Record<string, any>): void {
        Object.entries(fields).forEach(([fieldName, fieldValue]) => {
            // Skip null/undefined values
            if (fieldValue === null || fieldValue === undefined) {
                return;
            }

            // Validate specific field types
            if (fieldName.includes('日期') || fieldName.includes('时间')) {
                if (typeof fieldValue !== 'number' || fieldValue < 0) {
                    throw new InvalidFieldException(fieldName, fieldValue);
                }
            }

            if (fieldName.includes('评分') || fieldName.includes('进度')) {
                if (typeof fieldValue !== 'number' || fieldValue < 0 || fieldValue > 5) {
                    throw new InvalidFieldException(fieldName, fieldValue);
                }
            }

            if (fieldName.includes('复选框')) {
                if (typeof fieldValue !== 'boolean') {
                    throw new InvalidFieldException(fieldName, fieldValue);
                }
            }

            if (fieldName.includes('电话') || fieldName.includes('手机')) {
                if (typeof fieldValue !== 'string' || !/^\\+?[1-9]\\d{1,14}$/.test(fieldValue.replace(/[\\s-]/g, ''))) {
                    throw new InvalidFieldException(fieldName, fieldValue);
                }
            }

            if (fieldName.includes('邮箱') || fieldName.includes('email')) {
                if (typeof fieldValue !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(fieldValue)) {
                    throw new InvalidFieldException(fieldName, fieldValue);
                }
            }
        });
    }

    /**
     * Clean and normalize field values
     */
    static normalizeFields(fields: Record<string, any>): Record<string, any> {
        const normalized: Record<string, any> = {};

        Object.entries(fields).forEach(([fieldName, fieldValue]) => {
            // Skip null/undefined values
            if (fieldValue === null || fieldValue === undefined) {
                return;
            }

            // Normalize strings
            if (typeof fieldValue === 'string') {
                normalized[fieldName] = fieldValue.trim();
            }
            // Normalize dates
            else if (fieldValue instanceof Date) {
                normalized[fieldName] = fieldValue.getTime();
            }
            // Keep other values as-is
            else {
                normalized[fieldName] = fieldValue;
            }
        });

        return normalized;
    }

    /**
     * Validate and normalize fields in one step
     */
    static validateAndNormalize(
        fields: Record<string, any>,
        requiredFields: string[] = []
    ): Record<string, any> {
        const normalized = this.normalizeFields(fields);
        this.validateRequiredFields(normalized, requiredFields);
        this.validateFieldTypes(normalized);
        return normalized;
    }
}