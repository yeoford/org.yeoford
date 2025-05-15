import {
  format,
  formatDistanceToNow,
  formatDuration as formatDurationFns,
  formatISO,
  fromUnixTime,
  getUnixTime,
  parseISO,
} from 'date-fns';

import { safeParseFloat, safeParseInt } from './number';

export type ISODateString = string;

export const isISODateString = (
  dateString: unknown
): dateString is ISODateString =>
  typeof dateString === 'string' && isoStringToDate(dateString) !== null;

// import { createLog } from '@helpers/log';

// const log = createLog('datetime');

export const parseISO8601Duration = (duration: string) => {
  // Handle the case of empty or invalid input
  if (!duration || typeof duration !== 'string') {
    return null;
  }

  // Regular expression to match each component
  const matches = duration.match(
    /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/
  );

  if (!matches) {
    return null;
  }

  // Extract components (convert to numbers, default to 0 if not present)
  const [, years, months, days, hours, minutes, seconds] = matches.map((m) =>
    m ? safeParseFloat(m) : 0
  );

  return {
    days,
    formatVideoLength: () => {
      const h = hours ? String(hours).padStart(2, '0') + ':' : '';
      const m = String(minutes).padStart(h ? 2 : 1, '0');
      const s = String(Math.round(seconds)).padStart(2, '0');
      return `${h}${m}:${s}`;
    },
    hours,
    minutes,
    months,
    seconds,

    toHumanReadable: () => {
      const parts = [];
      if (years) {
        parts.push(`${years} year${years !== 1 ? 's' : ''}`);
      }
      if (months) {
        parts.push(`${months} month${months !== 1 ? 's' : ''}`);
      }
      if (days) {
        parts.push(`${days} day${days !== 1 ? 's' : ''}`);
      }
      if (hours) {
        parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      }
      if (minutes) {
        parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      }
      if (seconds) {
        parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
      }
      return parts.join(', ') || '0 seconds';
    },

    // Helper methods
    toSeconds: () =>
      seconds +
      minutes * 60 +
      hours * 3600 +
      days * 86_400 +
      months * 2_592_000 + // Approximate, assumes 30-day month
      years * 31_536_000,

    years,
  };
};

type AcceptedDate = Date | string | undefined;

export const formatTimeAgo = (date: AcceptedDate) => {
  if (!date) {
    return 'now';
  }
  return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, {
    addSuffix: true,
  });
};

export const formatShortDate = (date?: AcceptedDate) => {
  const d = createDate(date);
  return format(d, 'MMM d, yyyy');
};

export const formatShortDateTime = (
  date?: AcceptedDate,
  includeMs: boolean = false
) => {
  const d = createDate(date);
  return format(d, includeMs ? 'MMM d, HH:mm:ss' : 'MMM d, HH:mm');
};

export const formatShortTime = (date?: AcceptedDate) => {
  const d = createDate(date);
  return format(d, 'HH:mm');
};

/**
 * Returns the Unix timestamp for the current date and time
 */
export const getUnixTimeFromNow = () => getUnixTime(new Date());

export const getCurrentYear = () => new Date().getFullYear();

/**
 * Returns the Unix timestamp for the start of today
 */
export const getUnixTimeFromToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getUnixTime(today);
};

/**
 * Returns the Unix timestamp for a given date
 */
export const getUnixTimeFromDate = (date?: AcceptedDate): number => {
  if (!date) {
    return 0;
  }
  return getUnixTime(typeof date === 'string' ? parseISO(date) : date);
};

/**
 * Returns a Date object from a Unix timestamp
 */
export const getDateFromUnixTime = (
  unixTime: number | string | undefined
): Date => {
  if (!unixTime) {
    return new Date();
  }
  return fromUnixTime(
    typeof unixTime === 'string' ? safeParseInt(unixTime) : unixTime
  );
};

/**
 * Returns an ISO string from a Date object
 */
export const dateToISOString = (date?: Date | string | number): string => {
  if (typeof date === 'number') {
    date = millisecondsSinceEpochToDate(date);
  }

  if (typeof date === 'string') {
    date = createDate(date);
  }

  return formatISO(date ?? new Date());
};

/**
 * Returns a Date object from an ISO string
 */
export const isoStringToDate = (isoString: string): Date => parseISO(isoString);

/**
 * Returns a Date object from a date string
 */
export const createDate = (dateString?: AcceptedDate): Date => {
  if (!dateString) {
    return new Date();
  }
  return typeof dateString === 'string' ? parseISO(dateString) : dateString;
};

export const toDate = (dateString?: AcceptedDate): Date => {
  if (!dateString) {
    return new Date();
  }
  return typeof dateString === 'string' ? parseISO(dateString) : dateString;
};

export const toUnixTime = (dateString?: AcceptedDate): number =>
  getUnixTimeFromDate(toDate(dateString));

export const dateToLocaleString = (dateString?: AcceptedDate): string =>
  toDate(dateString).toLocaleString('en-GB', {
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    month: 'long',
    timeZoneName: 'short',
    year: 'numeric',
  });

export const dateToRouteDbName = (date?: AcceptedDate) => {
  date = date ?? new Date();
  return format(date, 'yyyy-MM-dd-HH-mm');
};

export const millisecondsSinceEpochToDate = (milliseconds: number) =>
  new Date(milliseconds);

export const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  // const seconds = duration % 60;
  // return `${hours}:${minutes}:${seconds}`;

  return formatDurationFns(
    { hours, minutes },
    { format: ['hours', 'minutes'] }
  );
};

export const parseMonthYear = (dateString: string): Date | null => {
  try {
    // Parse the date string into a Date object
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Set the day to the 1st of the month to avoid timezone issues
    date.setDate(1);
    return date;
  } catch (error) {
    return null;
  }
};
