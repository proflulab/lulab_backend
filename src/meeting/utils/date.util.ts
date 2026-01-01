/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-01 09:13:18
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-01 19:47:25
 * @FilePath: /lulab_backend/src/meeting/utils/date.util.ts
 * @Description: Date utility functions for parsing and merging date/time inputs
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

type DateInput = number | string;

function parseToDate(input: DateInput): Date {
  if (typeof input === 'number') {
    const str = String(input);
    if (str.length === 10) {
      return new Date(input * 1000);
    }
    return new Date(input);
  }

  if (/^\d+$/.test(input)) {
    const num = Number(input);
    const str = String(num);
    if (str.length === 10) {
      return new Date(num * 1000);
    }
    return new Date(num);
  }

  return new Date(input);
}

function mergeTimestamp(dateInput: DateInput, timeInput: DateInput): number {
  const date = parseToDate(dateInput);
  const time = parseToDate(timeInput);

  if (isNaN(date.getTime()) || isNaN(time.getTime())) {
    throw new Error('Invalid date input');
  }

  date.setHours(
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds(),
  );

  return date.getTime();
}

export { DateInput, parseToDate, mergeTimestamp };
