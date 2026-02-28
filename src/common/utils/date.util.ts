export function getDeadlineAfterHours(hours: number): Date {
  const now = Date.now();
  return new Date(now + hours * 60 * 60 * 1000);
}

export function parseReportMonth(value: string): Date {
  const normalized = `${value}-01T00:00:00.000Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Month must be in YYYY-MM format');
  }
  return parsed;
}
