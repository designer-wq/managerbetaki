// Utility functions

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export const formatDistanceToNow = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) {
        return 'Agora mesmo';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    } else if (diffHours < 24) {
        return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffDays < 7) {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks} semana${diffWeeks > 1 ? 's' : ''} atrás`;
    } else if (diffMonths < 12) {
        return `${diffMonths} ${diffMonths > 1 ? 'meses' : 'mês'} atrás`;
    } else {
        return date.toLocaleDateString('pt-BR');
    }
};

/**
 * Format seconds to HH:MM:SS
 */
export const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Format minutes to readable string (e.g., "2h 30min")
 */
export const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
        return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
};

/**
 * Class names utility (like clsx/classnames)
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Generate a random color from a predefined palette
 */
export const getRandomColor = (seed?: string): string => {
    const colors = [
        '#bcd200', '#60a5fa', '#fb923c', '#a855f7',
        '#ec4899', '#22d3ee', '#4ade80', '#facc15'
    ];

    if (seed) {
        // Deterministic color based on seed
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    return colors[Math.floor(Math.random() * colors.length)];
};
