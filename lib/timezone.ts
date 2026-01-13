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
 * Parse a date string or Date object to São Paulo timezone
 * Use this when you need to convert an existing date to São Paulo time
 */
export function parseDateToSP(dateInput: string | Date): Date {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Date(date.toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE }));
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

/**
 * Get current timestamp in ISO format for São Paulo timezone
 * Use this instead of new Date().toISOString() to ensure UTC-3 consistency
 */
export function getNowISO(): string {
    const now = getSaoPauloDate();
    // Convert to ISO string but adjust for São Paulo timezone
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    // Return in ISO format with -03:00 timezone
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}-03:00`;
}

/**
 * Convert a Date object to ISO string in São Paulo timezone
 */
export function toISOStringSP(date: Date): string {
    // Convert to São Paulo timezone
    const spDate = new Date(date.toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE }));
    const year = spDate.getFullYear();
    const month = String(spDate.getMonth() + 1).padStart(2, '0');
    const day = String(spDate.getDate()).padStart(2, '0');
    const hours = String(spDate.getHours()).padStart(2, '0');
    const minutes = String(spDate.getMinutes()).padStart(2, '0');
    const seconds = String(spDate.getSeconds()).padStart(2, '0');
    const ms = String(spDate.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}-03:00`;
}

/**
 * Get date N days ago in São Paulo timezone
 */
export function getDaysAgoSP(days: number): Date {
    const now = getSaoPauloDate();
    now.setDate(now.getDate() - days);
    return now;
}

/**
 * Check if a date is overdue (past deadline in São Paulo timezone)
 */
export function isOverdueSP(deadline: string | Date | null | undefined): boolean {
    if (!deadline) return false;

    const deadlineDate = typeof deadline === 'string' ? parseDateSP(deadline) : deadline;
    if (!deadlineDate) return false;

    const now = getSaoPauloDate();
    const deadlineEndOfDay = getEndOfDaySP(deadlineDate);

    return now > deadlineEndOfDay;
}

/**
 * Get the difference in days between two dates (São Paulo timezone)
 */
export function getDaysDifferenceSP(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? parseDateSP(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseDateSP(date2) : date2;

    if (!d1 || !d2) return 0;

    const start = getStartOfDaySP(d1);
    const end = getStartOfDaySP(d2);

    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a status name indicates a "delivered" status
 * Status entregues: Agendado, Postar, Ap.Gerente, Concluído, Entregue
 */
export function isDeliveredStatus(statusName: string | undefined | null): boolean {
    if (!statusName) return false;
    const s = statusName.toLowerCase().trim();
    return s.includes('agendado') ||
        s.includes('ag.odds') ||
        s.includes('postar') ||
        s.includes('ap.gerente') ||
        s.includes('ap. gerente') ||
        s.includes('gerente') ||
        s.includes('conclu') ||
        s.includes('entregue') ||
        s.includes('finaliz');
}

/**
 * Get the delivery date of a demand
 * Para demandas entregues, usa APENAS finished_at (data que foi para Postar)
 * Para demandas NÃO entregues, usa deadline (prazo)
 * Retorna string no formato YYYY-MM-DD ou null
 */
export function getDeliveryDateStr(demand: {
    statuses?: { name?: string };
    finished_at?: string | null;
    updated_at?: string;
    deadline?: string;
}): string | null {
    const statusName = demand.statuses?.name || '';

    // Para demandas com status de entrega: usa APENAS finished_at
    // NÃO usa deadline como fallback - só mostra se realmente foi entregue
    if (isDeliveredStatus(statusName)) {
        if (demand.finished_at) {
            return demand.finished_at.split('T')[0];
        }
        // Se não tem finished_at, retorna null (mostra "-")
        return null;
    }

    // Para outras demandas (não entregues), usa deadline
    if (demand.deadline) {
        return demand.deadline.split('T')[0];
    }

    return null;
}

/**
 * Check if a demand's delivery date matches a specific date string (YYYY-MM-DD)
 */
export function matchesDeliveryDate(demand: {
    statuses?: { name?: string };
    finished_at?: string | null;
    updated_at?: string;
    deadline?: string;
}, targetDate: string): boolean {
    const deliveryDate = getDeliveryDateStr(demand);
    return deliveryDate === targetDate;
}

export default {
    getSaoPauloDate,
    parseDateToSP,
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
    getTodaySP,
    getNowISO,
    toISOStringSP,
    getDaysAgoSP,
    isOverdueSP,
    getDaysDifferenceSP,
    isDeliveredStatus,
    getDeliveryDateStr,
    matchesDeliveryDate
};
