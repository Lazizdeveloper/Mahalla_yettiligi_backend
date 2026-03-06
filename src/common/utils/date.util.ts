export function getDeadlineAfterHours(hours: number): Date {
  const now = Date.now();
  return new Date(now + hours * 60 * 60 * 1000);
}

export function parseReportMonth(value: string): Date {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value.trim());
  if (!match) {
    throw new Error('Month must be in YYYY-MM format');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const parsed = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  return parsed;
}
