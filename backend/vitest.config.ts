import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/domain/analytics/metrics.utils.ts',
        'src/domain/analytics/scope.utils.ts',
        'src/domain/inventory/stock.mapper.ts',
        'src/domain/notification/draftTransfer.service.ts',
        'src/domain/transaction/transactionOutletBackfill.service.ts',
        'src/middlewares/outletGuards.ts',
        'src/lib/roles.ts',
        'src/services/outletService.ts',
        'src/services/transferService.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/test/**'],
      thresholds: {
        statements: 70,
        branches: 63,
        functions: 70,
        lines: 70,
      },
      reporter: ['text-summary', 'text'],
    },
  },
});
