import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateStr: string | undefined, fmt = 'dd MMM yyyy'): string => {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, fmt) : '-';
  } catch {
    return '-';
  }
};

/**
 * Format number with Indian comma system (e.g., 1,00,000)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

/**
 * Get status badge class
 */
export const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    Completed: 'badge-success',
    Ongoing: 'badge-info',
    Scheduled: 'badge-primary',
    Cancelled: 'badge-danger',
    Postponed: 'badge-warning',
    Active: 'badge-success',
    Inactive: 'badge-danger',
    Enrolled: 'badge-primary',
    Attending: 'badge-info',
    Dropped: 'badge-danger',
    Absent: 'badge-warning',
    SUCCESS: 'badge-success',
    FAILED: 'badge-danger',
  };
  return map[status] || 'badge-muted';
};

/**
 * Get initials from full name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Download blob as file
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadBlob = downloadFile;

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLen: number): string => {
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
};

/**
 * Get month name from number (1-12)
 */
export const getMonthName = (month: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};

/**
 * Extract API error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { message?: string } } };
    return err.response?.data?.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

/**
 * Checks whether an email address belongs to authorized Government / Research domains:
 * @csir.res.in, @*.gov.in, @*.res.in, @nic.in
 */
export const isTrustedGovEmail = (email: string | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  const govRegex = /@([a-zA-Z0-9-]+\.)*(csir\.res\.in|gov\.in|res\.in|nic\.in)$/i;
  return govRegex.test(cleanEmail);
};
