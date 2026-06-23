import { Request, Response } from 'express';
import { createTransferSchema } from '../schemas/transferSchema';
import * as transferService from '../services/transferService';
import { TransferStatus } from '@prisma/client';
import { getErrorMessage } from '../lib/errors';

export async function createTransfer(req: Request, res: Response): Promise<Response> {
  try {
    let safeFromOutletId = req.body.fromOutletId;
    if (!req.hasTenantWideOutletAccess) {
      safeFromOutletId = req.outletId;
    }

    const validation = createTransferSchema.safeParse({ ...req.body, fromOutletId: safeFromOutletId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input transfer stok gagal.',
        errors: validation.error.format()
      });
    }

    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const data = await transferService.createTransfer(tenantId, userId, validation.data);

    return res.status(201).json({
      success: true,
      message: data.status === 'IN_TRANSIT'
        ? 'Transfer stok berhasil dibuat dan barang dalam perjalanan.'
        : 'Permintaan transfer stok berhasil diajukan sebagai draf.',
      data
    });
  } catch (error: unknown) {
    console.error('[TransferController.createTransfer]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat membuat transfer stok.'),
    });
  }
}

export async function listTransfers(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const fromOutletId = req.query.fromOutletId as string;
    const toOutletId = req.query.toOutletId as string;
    const status = req.query.status as TransferStatus;

    const data = await transferService.listTransfers(tenantId, {
      fromOutletId,
      toOutletId,
      status
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: unknown) {
    console.error('[TransferController.listTransfers]', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar transfer stok.'
    });
  }
}

export async function approveTransfer(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const data = await transferService.approveTransfer(tenantId, userId, id);

    return res.status(200).json({
      success: true,
      message: 'Transfer stok berhasil disetujui, stok asal dikurangi dan barang dalam perjalanan.',
      data
    });
  } catch (error: unknown) {
    console.error('[TransferController.approveTransfer]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat menyetujui transfer stok.'),
    });
  }
}

export async function completeTransfer(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const data = await transferService.completeTransfer(tenantId, userId, id);

    return res.status(200).json({
      success: true,
      message: 'Transfer stok berhasil diselesaikan, barang diterima di outlet tujuan.',
      data
    });
  } catch (error: unknown) {
    console.error('[TransferController.completeTransfer]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat menyelesaikan transfer stok.'),
    });
  }
}

export async function cancelTransfer(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const data = await transferService.cancelTransfer(tenantId, userId, id);

    return res.status(200).json({
      success: true,
      message: 'Transfer stok berhasil dibatalkan.',
      data
    });
  } catch (error: unknown) {
    console.error('[TransferController.cancelTransfer]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat membatalkan transfer stok.'),
    });
  }
}
