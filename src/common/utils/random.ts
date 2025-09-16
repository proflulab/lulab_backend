/**
 * 生成指定位数的数字验证码
 * @param length 位数，默认为6
 */
export function generateNumericCode(length = 6): string {
  if (length <= 0) return '';
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}
