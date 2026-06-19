import { describe, expect, it } from 'vitest';
import {
  addMonthMetrics,
  addTodayMetrics,
  calculateTransactionProfit,
  emptyMetrics,
  startOfLocalDay,
  startOfLocalMonth,
} from './metrics.utils';

describe('metrics.utils', () => {
  it('calculateTransactionProfit subtracts discount from item margins', () => {
    const profit = calculateTransactionProfit({
      discount: 1000,
      items: [
        { priceAtTransaction: 10000, costAtTransaction: 6000, quantity: 2 },
      ],
    });
    expect(profit).toBe(7000);
  });

  it('emptyMetrics returns zeroed accumulator', () => {
    expect(emptyMetrics()).toEqual({
      revenueToday: 0,
      revenueMonth: 0,
      profitToday: 0,
      profitMonth: 0,
      transactionsToday: 0,
    });
  });

  it('addTodayMetrics increments today fields only', () => {
    const acc = emptyMetrics();
    addTodayMetrics(acc, 50000, 12000);
    expect(acc.revenueToday).toBe(50000);
    expect(acc.profitToday).toBe(12000);
    expect(acc.transactionsToday).toBe(1);
    expect(acc.revenueMonth).toBe(0);
  });

  it('addMonthMetrics increments month profit/revenue', () => {
    const acc = emptyMetrics();
    addMonthMetrics(acc, 100000, 25000);
    expect(acc.revenueMonth).toBe(100000);
    expect(acc.profitMonth).toBe(25000);
  });

  it('startOfLocalDay zeroes time component', () => {
    const d = new Date('2026-06-19T15:30:00');
    const start = startOfLocalDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getDate()).toBe(19);
  });

  it('startOfLocalMonth is first day of month', () => {
    const d = new Date('2026-06-19T15:30:00');
    const start = startOfLocalMonth(d);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(5);
  });
});
