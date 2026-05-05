/**
 * Attendance Status Utility
 * Central place to manage all attendance status display logic.
 */

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  ABSENT: 'ABSENT',
  OVERTIME: 'OVERTIME',
  MISSED_PUNCH: 'MISSED_PUNCH',
  WEEK_OFF: 'WEEK_OFF',
  HOLIDAY: 'HOLIDAY',
};

/**
 * Returns Tailwind CSS classes for a status badge.
 * @param {string} status - The attendance status string.
 * @returns {{ bg: string, text: string, dot: string, label: string }}
 */
export function getStatusStyle(status) {
  switch ((status || '').toUpperCase()) {
    case 'PRESENT':
      return {
        bg:    'bg-emerald-100 dark:bg-emerald-900/30',
        text:  'text-emerald-700 dark:text-emerald-400',
        dot:   'bg-emerald-500',
        label: 'PRESENT',
      };
    case 'LATE':
      return {
        bg:    'bg-amber-100 dark:bg-amber-900/30',
        text:  'text-amber-700 dark:text-amber-400',
        dot:   'bg-amber-500',
        label: 'LATE',
      };
    case 'HALF_DAY':
      return {
        bg:    'bg-orange-100 dark:bg-orange-900/30',
        text:  'text-orange-700 dark:text-orange-400',
        dot:   'bg-orange-500',
        label: 'HALF DAY',
      };
    case 'ABSENT':
      return {
        bg:    'bg-red-100 dark:bg-red-900/30',
        text:  'text-red-700 dark:text-red-400',
        dot:   'bg-red-500',
        label: 'ABSENT',
      };
    case 'OVERTIME':
      return {
        bg:    'bg-violet-100 dark:bg-violet-900/30',
        text:  'text-violet-700 dark:text-violet-400',
        dot:   'bg-violet-500',
        label: 'OVERTIME',
      };
    case 'MISSED_PUNCH':
      return {
        bg:    'bg-rose-100 dark:bg-rose-900/30',
        text:  'text-rose-700 dark:text-rose-400',
        dot:   'bg-rose-500',
        label: 'MISSED PUNCH',
      };
    case 'WEEK_OFF':
      return {
        bg:    'bg-slate-200 dark:bg-slate-800',
        text:  'text-slate-600 dark:text-slate-400',
        dot:   'bg-slate-400',
        label: 'WEEK OFF',
      };
    case 'HOLIDAY':
      return {
        bg:    'bg-sky-100 dark:bg-sky-900/30',
        text:  'text-sky-700 dark:text-sky-400',
        dot:   'bg-sky-500',
        label: 'HOLIDAY',
      };
    default:
      return {
        bg:    'bg-slate-100 dark:bg-slate-700',
        text:  'text-slate-600 dark:text-slate-300',
        dot:   'bg-slate-400',
        label: (status || 'UNKNOWN').toUpperCase(),
      };
  }
}

/**
 * Returns a full badge JSX string (for use as className string only).
 * Use getStatusStyle() directly in JSX for full control.
 */
export function getStatusBadgeClass(status) {
  const { bg, text } = getStatusStyle(status);
  return `${bg} ${text} text-[10px] font-bold uppercase px-2 py-0.5 rounded-full`;
}

/**
 * Returns only the color classes (bg and text).
 */
export function getStatusColorClasses(status) {
  const { bg, text } = getStatusStyle(status);
  return `${bg} ${text}`;
}
