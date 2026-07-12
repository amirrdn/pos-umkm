import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockMidtransService, mockProcessSubscriptionWebhook, mockCompleteQris, mockVoidQris, mockPrisma } =
  vi.hoisted(() => ({
    mockMidtransService: {
      verifySignature: vi.fn(),
    },
    mockProcessSubscriptionWebhook: vi.fn(),
    mockCompleteQris: vi.fn(),
    mockVoidQris: vi.fn(),
    mockPrisma: {
      transaction: {
        findFirst: vi.fn(),
      },
    },
  }));

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../services/midtransService', () => ({
  MidtransService: mockMidtransService,
}));

vi.mock('../../services/subscriptionMidtransWebhookService', () => ({
  processSubscriptionMidtransWebhook: mockProcessSubscriptionWebhook,
}));

vi.mock('../../services/transactionQrisSettlementService', () => ({
  completeQrisSettlement: mockCompleteQris,
  voidQrisTransaction: mockVoidQris,
  isQrisFailureStatus: (status: string) => ['expire', 'cancel', 'deny'].includes(status),
}));

import { processMidtransPosWebhook } from '../../services/transactionWebhookService';

const validPayload = {
  order_id: 'INV-20260621-001',
  status_code: '200',
  gross_amount: '10000.00',
  signature_key: 'abc123',
  transaction_status: 'settlement',
};

describe('processMidtransPosWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMidtransService.verifySignature.mockReturnValue(true);
  });

  it('rejects incomplete payload', async () => {
    const result = await processMidtransPosWebhook({ order_id: 'INV-001' });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toContain('Payload webhook tidak lengkap');
  });

  it('rejects invalid signature', async () => {
    mockMidtransService.verifySignature.mockReturnValue(false);

    const result = await processMidtransPosWebhook(validPayload);

    expect(result.httpStatus).toBe(403);
  });

  it('delegates subscription invoices to SubscriptionService', async () => {
    const result = await processMidtransPosWebhook({
      ...validPayload,
      order_id: 'INV-SUB-20260621-001',
    });

    expect(mockProcessSubscriptionWebhook).toHaveBeenCalledOnce();
    expect(result.httpStatus).toBe(200);
    expect(result.message).toContain('langganan');
  });

  it('settles pending POS transaction on settlement status', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: 'txn-1',
      status: 'PENDING',
      items: [],
    });

    const result = await processMidtransPosWebhook(validPayload);

    expect(mockCompleteQris).toHaveBeenCalledWith({
      transactionId: 'txn-1',
    });
    expect(result.httpStatus).toBe(200);
  });

  it('voids pending POS transaction on expire status', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: 'txn-2',
      status: 'PENDING',
      items: [],
    });

    const result = await processMidtransPosWebhook({
      ...validPayload,
      transaction_status: 'expire',
    });

    expect(mockVoidQris).toHaveBeenCalledWith('txn-2');
    expect(result.httpStatus).toBe(200);
  });

  it('returns 404 when transaction not found', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(null);

    const result = await processMidtransPosWebhook(validPayload);

    expect(result.httpStatus).toBe(404);
  });
});
