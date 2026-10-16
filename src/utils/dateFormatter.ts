/**
 * Date & Time Utility for Illumine ELMS (Frontend)
 * Timezone: Asia/Colombo (Sri Lanka Standard Time, UTC+05:30)
 */

export const SRI_LANKA_TZ = 'Asia/Colombo';

/**
 * Formats a Date object, ISO string, or timestamp into Sri Lanka Display Date (e.g., "05 October 2026")
 */
export const formatColomboDisplayDate = (dateInput?: string | Date | number | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: SRI_LANKA_TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

/**
 * Formats a Date object, ISO string, or timestamp into Sri Lanka ISO Date string (YYYY-MM-DD)
 */
export const formatColomboDate = (dateInput?: string | Date | number | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SRI_LANKA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

/**
 * Formats a Date object, ISO string, or timestamp into Sri Lanka Local Time (e.g., "6:00 PM")
 */
export const formatColomboTime = (dateInput?: string | Date | number | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: SRI_LANKA_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * Formats a Date object, ISO string, or timestamp into combined Sri Lanka Date & Time (e.g. "05 Oct 2026, 6:00 PM")
 */
export const formatColomboDateTime = (dateInput?: string | Date | number | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const dateStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: SRI_LANKA_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: SRI_LANKA_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);

  return `${dateStr}, ${timeStr}`;
};

/**
 * Returns the same calendar day in the next month. If the next month is shorter,
 * it falls back to that month's final day.
 */
export const getNextMonthSameDate = (dateInput?: string | Date | number | null): string => {
  const base = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(base.getTime())) return '';

  const next = new Date(base);
  const targetDay = base.getDate();

  next.setDate(1);
  next.setMonth(next.getMonth() + 1);

  const lastDayOfNextMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0
  ).getDate();

  next.setDate(Math.min(targetDay, lastDayOfNextMonth));
  return next.toISOString();
};

/**
 * Helper to convert time string (e.g. "18:00" or "06:00 PM") to minutes from midnight
 */
export const parseTimeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const cleanTime = timeStr.trim();
  if (!cleanTime) return -1;

  const isPM = /pm/i.test(cleanTime);
  const isAM = /am/i.test(cleanTime);
  const numParts = cleanTime.replace(/[^\d:]/g, '').split(':');

  let hours = 0;
  let minutes = 0;

  if (numParts.length >= 1 && numParts[0] !== '') {
    hours = parseInt(numParts[0], 10);
  }
  if (numParts.length >= 2 && numParts[1] !== '') {
    minutes = parseInt(numParts[1], 10);
  }

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Validates start and end time for class schedules
 */
export const validateClassTimes = (startTime?: string, endTime?: string): { isValid: boolean; message?: string } => {
  if (!startTime) {
    return { isValid: false, message: 'Start time is required' };
  }
  if (!endTime) {
    return { isValid: false, message: 'End time is required' };
  }

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);

  if (startMins < 0) {
    return { isValid: false, message: 'Invalid start time format' };
  }
  if (endMins < 0) {
    return { isValid: false, message: 'Invalid end time format' };
  }

  if (endMins <= startMins) {
    return { isValid: false, message: 'End time must be later than start time' };
  }

  return { isValid: true };
};

/**
 * Formats start and end times into a clean range string (e.g. "6:00 PM – 7:30 PM")
 */
export const formatTimeRange = (startTimeStr?: string, endTimeStr?: string): string => {
  if (!startTimeStr && !endTimeStr) return '';
  
  const formatSingle = (tStr?: string) => {
    if (!tStr) return '';
    const mins = parseTimeToMinutes(tStr);
    if (mins < 0) return tStr;
    const hours24 = Math.floor(mins / 60);
    const minsRemainder = mins % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const minsPadded = minsRemainder.toString().padStart(2, '0');
    return `${hours12}:${minsPadded} ${period}`;
  };

  const startFormatted = formatSingle(startTimeStr);
  const endFormatted = formatSingle(endTimeStr);

  if (startFormatted && endFormatted) {
    return `${startFormatted} – ${endFormatted}`;
  }
  return startFormatted || endFormatted || '';
};
