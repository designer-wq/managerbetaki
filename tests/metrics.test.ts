import { describe, it, expect } from 'vitest';
import {
    isStatusCompleted,
    isStatusActive,
    checkInRange,
    diffDays,
    parseDate
} from '../lib/reports/metrics';

describe('Report Metrics Helpers', () => {
    describe('isStatusCompleted', () => {
        it('should return true for completed statuses', () => {
            expect(isStatusCompleted('Concluído')).toBe(true);
            expect(isStatusCompleted('concluido')).toBe(true);
            expect(isStatusCompleted('Entregue')).toBe(true);
            expect(isStatusCompleted('Finalizado')).toBe(true);
            expect(isStatusCompleted('Postar')).toBe(true);
            expect(isStatusCompleted('Agendado')).toBe(true);
            expect(isStatusCompleted('Ap.Gerente')).toBe(true);
            expect(isStatusCompleted('Ag.Odds')).toBe(true);
        });

        it('should return false for non-completed statuses', () => {
            expect(isStatusCompleted('Backlog')).toBe(false);
            expect(isStatusCompleted('Em Produção')).toBe(false);
            expect(isStatusCompleted('Revisão')).toBe(false);
            expect(isStatusCompleted('Pendente')).toBe(false);
            expect(isStatusCompleted(undefined)).toBe(false);
            expect(isStatusCompleted('')).toBe(false);
        });
    });

    describe('isStatusActive', () => {
        it('should return true for active statuses', () => {
            expect(isStatusActive('Backlog')).toBe(true);
            expect(isStatusActive('Em Produção')).toBe(true);
            expect(isStatusActive('Revisão')).toBe(true);
            expect(isStatusActive('Pendente')).toBe(true);
        });

        it('should return false for completed statuses', () => {
            expect(isStatusActive('Concluído')).toBe(false);
            expect(isStatusActive('Entregue')).toBe(false);
            expect(isStatusActive('Agendado')).toBe(false);
        });

        it('should return false for canceled statuses', () => {
            expect(isStatusActive('Cancelado')).toBe(false);
            expect(isStatusActive('Demanda Cancelada')).toBe(false);
        });
    });

    describe('parseDate', () => {
        it('should parse valid date strings', () => {
            const date = parseDate('2024-01-15');
            expect(date).toBeInstanceOf(Date);
            expect(date?.getFullYear()).toBe(2024);
        });

        it('should parse ISO date strings', () => {
            const date = parseDate('2024-01-15T10:30:00Z');
            expect(date).toBeInstanceOf(Date);
        });

        it('should return null for null input', () => {
            expect(parseDate(null)).toBeNull();
        });
    });

    describe('diffDays', () => {
        it('should calculate difference in days correctly', () => {
            const d1 = new Date('2024-01-01');
            const d2 = new Date('2024-01-11');
            expect(diffDays(d1, d2)).toBe(10);
        });

        it('should return positive difference regardless of order', () => {
            const d1 = new Date('2024-01-11');
            const d2 = new Date('2024-01-01');
            expect(diffDays(d1, d2)).toBe(10);
        });

        it('should return 0 for same day', () => {
            const d1 = new Date('2024-01-15');
            const d2 = new Date('2024-01-15');
            expect(diffDays(d1, d2)).toBe(0);
        });
    });

    describe('checkInRange', () => {
        const filter = {
            type: 'custom' as const,
            startDate: '2024-01-01',
            endDate: '2024-01-31'
        };

        it('should return true for date within range', () => {
            expect(checkInRange('2024-01-15', filter)).toBe(true);
            expect(checkInRange('2024-01-01', filter)).toBe(true);
            expect(checkInRange('2024-01-31', filter)).toBe(true);
        });

        it('should return false for date outside range', () => {
            expect(checkInRange('2023-12-31', filter)).toBe(false);
            expect(checkInRange('2024-02-01', filter)).toBe(false);
        });

        it('should return true when filter type is all', () => {
            const allFilter = { type: 'all' as const, startDate: null, endDate: null };
            expect(checkInRange('2024-01-15', allFilter)).toBe(true);
            expect(checkInRange(null, allFilter)).toBe(true);
        });

        it('should return true when filter is undefined', () => {
            expect(checkInRange('2024-01-15', undefined)).toBe(true);
        });

        it('should return false for null date when filter is active', () => {
            expect(checkInRange(null, filter)).toBe(false);
        });

        it('should handle ISO date strings', () => {
            expect(checkInRange('2024-01-15T10:30:00Z', filter)).toBe(true);
        });
    });
});
