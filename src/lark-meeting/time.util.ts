export const toMs = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v < 10000000000 ? v * 1000 : v;
  }
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n < 10000000000 ? n * 1000 : n;
    }
  }
  if (v instanceof Date) {
    return v.getTime();
  }
  return undefined;
};
