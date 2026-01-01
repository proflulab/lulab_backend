import { parseToDate, mergeTimestamp } from './date.util';

describe('parseToDate', () => {
  describe('with number input', () => {
    it('converts 10-digit timestamp (seconds) to Date', () => {
      const timestamp = 1735689600;
      const result = parseToDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp * 1000);
    });

    it('converts 13-digit timestamp (milliseconds) to Date', () => {
      const timestamp = 1735689600000;
      const result = parseToDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it('handles various timestamp lengths correctly', () => {
      const timestamp10 = 1735689600;
      const result10 = parseToDate(timestamp10);
      expect(result10.getTime()).toBe(timestamp10 * 1000);

      const timestamp13 = 1735689600000;
      const result13 = parseToDate(timestamp13);
      expect(result13.getTime()).toBe(timestamp13);
    });
  });

  describe('with string input', () => {
    it('converts numeric string with 10 digits to Date', () => {
      const timestamp = '1735689600';
      const result = parseToDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(Number(timestamp) * 1000);
    });

    it('converts numeric string with 13 digits to Date', () => {
      const timestamp = '1735689600000';
      const result = parseToDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(Number(timestamp));
    });

    it('converts ISO date string to Date', () => {
      const isoString = '2024-01-01T00:00:00.000Z';
      const result = parseToDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });

    it('converts date string to Date', () => {
      const dateString = '2024-01-01';
      const result = parseToDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('handles various date string formats', () => {
      const formats = ['2024-01-01 12:00:00', '2024/01/01', 'January 1, 2024'];
      for (const format of formats) {
        const result = parseToDate(format);
        expect(result).toBeInstanceOf(Date);
      }
    });
  });

  describe('edge cases', () => {
    it('handles zero timestamp', () => {
      const result = parseToDate(0);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(0);
    });

    it('handles negative timestamp', () => {
      const result = parseToDate(-1000000);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(-1000000);
    });

    it('handles invalid date string gracefully', () => {
      const result = parseToDate('invalid-date');
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });
  });
});

describe('mergeTimestamp', () => {
  describe('successful merging', () => {
    it('merges date and time from number inputs', () => {
      const dateInput = 1735689600000;
      const timeInput = 1735693200000;
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('merges date and time from string inputs', () => {
      const dateInput = '2024-01-01';
      const timeInput = '2024-01-01T12:00:00.000Z';
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('merges date and time from mixed inputs', () => {
      const dateInput = 1735689600000;
      const timeInput = '2024-01-01T12:00:00.000Z';
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('preserves date part and applies time part', () => {
      const dateInput = '2024-01-01';
      const timeInput = '2024-01-01T14:30:45.123Z';
      const result = mergeTimestamp(dateInput, timeInput);
      const resultDate = new Date(result);
      expect(resultDate.getFullYear()).toBe(2024);
      expect(resultDate.getMonth()).toBe(0);
      expect(resultDate.getDate()).toBe(1);
      expect(resultDate.getMinutes()).toBe(30);
      expect(resultDate.getSeconds()).toBe(45);
      expect(resultDate.getMilliseconds()).toBe(123);
    });
  });

  describe('error handling', () => {
    it('throws error for invalid date input', () => {
      const dateInput = 'invalid-date';
      const timeInput = '2024-01-01T12:00:00.000Z';
      expect(() => mergeTimestamp(dateInput, timeInput)).toThrow(
        'Invalid date input',
      );
    });

    it('throws error for invalid time input', () => {
      const dateInput = '2024-01-01';
      const timeInput = 'invalid-time';
      expect(() => mergeTimestamp(dateInput, timeInput)).toThrow(
        'Invalid date input',
      );
    });

    it('throws error for both invalid inputs', () => {
      const dateInput = 'invalid-date';
      const timeInput = 'invalid-time';
      expect(() => mergeTimestamp(dateInput, timeInput)).toThrow(
        'Invalid date input',
      );
    });
  });

  describe('timestamp formats', () => {
    it('handles 10-digit timestamp for date input', () => {
      const dateInput = 1735689600;
      const timeInput = '2024-01-01T12:00:00.000Z';
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('handles 10-digit timestamp for time input', () => {
      const dateInput = '2024-01-01';
      const timeInput = 1735689600;
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('handles 13-digit timestamp for date input', () => {
      const dateInput = 1735689600000;
      const timeInput = '2024-01-01T12:00:00.000Z';
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('handles 13-digit timestamp for time input', () => {
      const dateInput = '2024-01-01';
      const timeInput = 1735689600000;
      const result = mergeTimestamp(dateInput, timeInput);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('merges meeting date and time', () => {
      const meetingDate = '2024-01-15';
      const meetingTime = '2024-01-01T09:30:00.000Z';
      const result = mergeTimestamp(meetingDate, meetingTime);
      const resultDate = new Date(result);
      expect(resultDate.getFullYear()).toBe(2024);
      expect(resultDate.getMonth()).toBe(0);
      expect(resultDate.getDate()).toBe(15);
      expect(resultDate.getMinutes()).toBe(30);
    });

    it('handles midnight time', () => {
      const dateInput = '2024-01-01';
      const timeInput = '2024-01-01T00:00:00.000Z';
      const result = mergeTimestamp(dateInput, timeInput);
      const resultDate = new Date(result);
      expect(resultDate.getMinutes()).toBe(0);
      expect(resultDate.getSeconds()).toBe(0);
      expect(resultDate.getMilliseconds()).toBe(0);
    });

    it('handles end of day time', () => {
      const dateInput = '2024-01-01';
      const timeInput = '2024-01-01T23:59:59.999Z';
      const result = mergeTimestamp(dateInput, timeInput);
      const resultDate = new Date(result);
      expect(resultDate.getMinutes()).toBe(59);
      expect(resultDate.getSeconds()).toBe(59);
      expect(resultDate.getMilliseconds()).toBe(999);
    });
  });
});
