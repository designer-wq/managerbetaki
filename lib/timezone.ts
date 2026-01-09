// Timezone utilities for São Paulo, Brazil (UTC-3)
const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Get current date in São Paulo timezone
 */
export function getSaoPauloDate(): Date {
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE }));
    return saoPauloTime;
}

/**
 * Format a date string to São Paulo timezone without timezone offset issues
 * Use this when creating date filters to avoid +1 day offset
 */
export function formatDateForFilter(dateString: string): string {
    // Parse the date and format it for São Paulo timezone
    const date = new Date(dateString + 'T00:00:00');
    return date.toISOString().split('T')[0];
}

/**
 * Get start of day in São Paulo timezone
 */
export function getStartOfDaySP(date?: Date): Date {
    const d = date ? new Date(date) : getSaoPauloDate();
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get end of day in São Paulo timezone
 */
export function getEndOfDaySP(date?: Date): Date {
    const d = date ? new Date(date) : getSaoPauloDate();
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Get start of week (Monday) in São Paulo timezone
 */
export function getStartOfWeekSP(date?: Date): Date {
    const d = date ? new Date(date) : getSaoPauloDate();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get end of week (Sunday) in São Paulo timezone
 */
export function getEndOfWeekSP(date?: Date): Date {
    const start = getStartOfWeekSP(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

/**
 * Parse a date string accounting for timezone
 * This prevents the +1 day offset when comparing dates
 */
export function parseDateSP(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    // If it's just a date (no time), add time component
    if (dateString.length === 10) {
        return new Date(dateString + 'T12:00:00-03:00'); // Midday São Paulo time
    }

    return new Date(dateString);
}

/**
 * Compare two dates (only year, month, day - ignoring time)
 */
export function isSameDaySP(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? parseDateSP(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseDateSP(date2) : date2;

    if (!d1 || !d2) return false;

    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRangeSP(
    date: Date | string | null | undefined,
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined
): boolean {
    if (!date) return false;

    const d = typeof date === 'string' ? parseDateSP(date) : date;
    if (!d) return false;

    const start = startDate ? (typeof startDate === 'string' ? parseDateSP(startDate) : startDate) : null;
    const end = endDate ? (typeof endDate === 'string' ? parseDateSP(endDate) : endDate) : null;

    if (start && end) {
        return d >= getStartOfDaySP(start) && d <= getEndOfDaySP(end);
    } else if (start) {
        return d >= getStartOfDaySP(start);
    } else if (end) {
        return d <= getEndOfDaySP(end);
    }

    return true;
}

/**
 * Format date for display in São Paulo timezone
 */
export function formatDateDisplaySP(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = typeof date === 'string' ? parseDateSP(date) : date;
    if (!d) return '-';

    return d.toLocaleDateString('pt-BR', {
        timeZone: SAO_PAULO_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Format date and time for display in São Paulo timezone
 */
export function formatDateTimeSP(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return '-';

    return d.toLocaleString('pt-BR', {
        timeZone: SAO_PAULO_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get today's date string in YYYY-MM-DD format (São Paulo timezone)
 */
export function getTodaySP(): string {
    const now = getSaoPauloDate();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default {
    getSaoPauloDate,
    formatDateForFilter,
    getStartOfDaySP,
    getEndOfDaySP,
    getStartOfWeekSP,
    getEndOfWeekSP,
    parseDateSP,
    isSameDaySP,
    isDateInRangeSP,
    formatDateDisplaySP,
    formatDateTimeSP,
    getTodaySP
};
