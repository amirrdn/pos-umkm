import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customerSchema';

const customerService = new CustomerService();

/**
 * Controller Layer untuk Pengelolaan Pelanggan.
 */
export class CustomerController {
  /**
   * Mengambil daftar pelanggan milik tenant saat ini, mendukung pencarian.
   */
  async getAllCustomers(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const search = req.query.search as string | undefined;
      const customers = await customerService.getAllCustomers(tenantId, search);

      return res.status(200).json({
        success: true,
        message: 'Daftar pelanggan berhasil diambil.',
        data: customers
      });
    } catch (error: any) {
      console.error('GetAllCustomers Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil daftar pelanggan.'
      });
    }
  }

  /**
   * Mengambil detail pelanggan berdasarkan ID.
   */
  async getCustomerById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const customerId = req.params.id;
      const customer = await customerService.getCustomerById(tenantId, customerId);

      return res.status(200).json({
        success: true,
        message: 'Detail pelanggan berhasil diambil.',
        data: customer
      });
    } catch (error: any) {
      console.error('GetCustomerById Controller Error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Pelanggan tidak ditemukan.'
      });
    }
  }

  /**
   * Membuat pelanggan baru.
   */
  async createCustomer(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const validation = createCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi data pelanggan gagal.',
          errors: validation.error.format()
        });
      }

      const customer = await customerService.createCustomer(tenantId, validation.data);

      return res.status(201).json({
        success: true,
        message: 'Pelanggan baru berhasil didaftarkan.',
        data: customer
      });
    } catch (error: any) {
      console.error('CreateCustomer Controller Error:', error);

      const message = error.message || '';
      if (message.includes('telepon') || message.includes('terdaftar')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mendaftarkan pelanggan.'
      });
    }
  }

  /**
   * Memperbarui data pelanggan.
   */
  async updateCustomer(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const customerId = req.params.id;

      const validation = updateCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi pembaruan data pelanggan gagal.',
          errors: validation.error.format()
        });
      }

      const customer = await customerService.updateCustomer(tenantId, customerId, validation.data);

      return res.status(200).json({
        success: true,
        message: 'Data pelanggan berhasil diperbarui.',
        data: customer
      });
    } catch (error: any) {
      console.error('UpdateCustomer Controller Error:', error);

      const message = error.message || '';
      if (message.includes('tidak ditemukan') || message.includes('telepon') || message.includes('digunakan')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memperbarui data pelanggan.'
      });
    }
  }

  /**
   * Menghapus data pelanggan (Hard Delete).
   */
  async deleteCustomer(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const customerId = req.params.id;

      await customerService.deleteCustomer(tenantId, customerId);

      return res.status(200).json({
        success: true,
        message: 'Pelanggan berhasil dihapus dari database.'
      });
    } catch (error: any) {
      console.error('DeleteCustomer Controller Error:', error);

      const message = error.message || '';
      if (message.includes('tidak ditemukan') || message.includes('hak akses')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat menghapus pelanggan.'
      });
    }
  }

  /**
   * Mencatat cicilan / pembayaran hutang pelanggan.
   */
  async payDebt(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const customerId = req.params.id;
      const { amount, paymentMethod, note } = req.body;

      if (amount === undefined || typeof amount !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Jumlah pembayaran tidak valid.'
        });
      }

      if (!paymentMethod || typeof paymentMethod !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Metode pembayaran wajib dipilih.'
        });
      }

      const result = await customerService.payDebt(tenantId, customerId, amount, paymentMethod, note);

      return res.status(200).json({
        success: true,
        message: 'Pembayaran hutang berhasil dicatat.',
        data: result
      });
    } catch (error: any) {
      console.error('PayDebt Controller Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal memproses pembayaran hutang.'
      });
    }
  }
}
