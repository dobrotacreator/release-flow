// Utility functions for date calculations and working day logic

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isHoliday(date: Date, customHolidays: string[]): boolean {
  const dateString = toUTCDateOnly(date);
  return customHolidays.includes(dateString);
}

export function isWorkingDay(
  date: Date,
  customHolidays: string[] = [],
): boolean {
  return !isWeekend(date) && !isHoliday(date, customHolidays);
}

export function addWorkingDays(
  startDate: Date,
  workingDays: number,
  customHolidays: string[] = [],
): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);

    if (isWorkingDay(result, customHolidays)) {
      daysAdded++;
    }
  }

  return result;
}

export function getWorkingDaysBetween(
  startDate: Date,
  endDate: Date,
  customHolidays: string[] = [],
): number {
  let workingDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWorkingDay(current, customHolidays)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toUTCDateOnly(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .split("T")[0];
}
