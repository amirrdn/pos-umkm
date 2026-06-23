import { logError } from '../lib/logger';
import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customerSchema';
import { getErrorMessage } from '../lib/errors';

const customerService = new CustomerService();

export async function getAllCustomers(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const search = req.query.search as string | undefined;
    const customers = await customerService.getAllCustomers(tenantId, search);

    return res.status(200).json({
      success: true,
      message: 'Daftar pelanggan berhasil diambil.',
      data: customers,
    });
  } catch (error: unknown) {
    logError('GetAllCustomers Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil daftar pelanggan.',
    });
  }
}

export async function getCustomerById(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const customerId = req.params.id;
    const customer = await customerService.getCustomerById(tenantId, customerId);

    return res.status(200).json({
      success: true,
      message: 'Detail pelanggan berhasil diambil.',
      data: customer,
    });
  } catch (error: unknown) {
    logError('GetCustomerById Controller Error:', error);
    return res.status(404).json({
      success: false,
      message: getErrorMessage(error, 'Pelanggan tidak ditemukan.'),
    });
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;

    const validation = createCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data pelanggan gagal.',
        errors: validation.error.format(),
      });
    }

    const customer = await customerService.createCustomer(tenantId, validation.data);

    return res.status(201).json({
      success: true,
      message: 'Pelanggan baru berhasil didaftarkan.',
      data: customer,
    });
  } catch (error: unknown) {
    logError('CreateCustomer Controller Error:', error);

    const message = getErrorMessage(error);
    if (message.includes('telepon') || message.includes('terdaftar')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mendaftarkan pelanggan.',
    });
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const customerId = req.params.id;

    const validation = updateCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pembaruan data pelanggan gagal.',
        errors: validation.error.format(),
      });
    }

    const customer = await customerService.updateCustomer(tenantId, customerId, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Data pelanggan berhasil diperbarui.',
      data: customer,
    });
  } catch (error: unknown) {
    logError('UpdateCustomer Controller Error:', error);

    const message = getErrorMessage(error);
    if (message.includes('tidak ditemukan') || message.includes('telepon') || message.includes('digunakan')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memperbarui data pelanggan.',
    });
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const customerId = req.params.id;

    await customerService.deleteCustomer(tenantId, customerId);

    return res.status(200).json({
      success: true,
      message: 'Pelanggan berhasil dihapus dari database.',
    });
  } catch (error: unknown) {
    logError('DeleteCustomer Controller Error:', error);

    const message = getErrorMessage(error);
    if (message.includes('tidak ditemukan') || message.includes('hak akses')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat menghapus pelanggan.',
    });
  }
}

