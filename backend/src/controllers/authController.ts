import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import {
  loginSchema,
  registerSchema,
  registerStaffSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../schemas/authSchema';
import {
  verifyEmailToken,
  resendVerificationEmail,
  EmailAlreadyRegisteredError,
  RegistrationEmailError,
} from '../domain/auth/emailVerification.service';
import { LoginError } from '../domain/auth/login.errors';
import { prisma } from '../lib/prisma';
import { getErrorMessage } from '../lib/errors';

const authService = new AuthService();

export async function login(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input login gagal.',
        errors: validation.error.format(),
      });
    }

    const { email, password } = validation.data;
    const result = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Login Controller Error:', error);

    if (error instanceof LoginError) {
      const status =
        error.code === 'INVALID_CREDENTIALS'
          ? 401
          : error.code === 'EMAIL_NOT_VERIFIED' || error.code === 'APPROVAL_PENDING'
            ? 403
            : 401;

      return res.status(status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses login.',
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input pendaftaran gagal.',
        errors: validation.error.format(),
      });
    }

    const result = await authService.registerTenant(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Periksa email Anda untuk verifikasi akun.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Register Controller Error:', error);

    if (error instanceof EmailAlreadyRegisteredError) {
      return res.status(error.code === 'EMAIL_NOT_VERIFIED_RESENT' ? 409 : 400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof RegistrationEmailError) {
      return res.status(502).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    const message = getErrorMessage(error);
    if (message.includes('sudah digunakan')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses registrasi.',
    });
  }
}

export async function registerStaff(req: Request, res: Response) {
  try {
    const validation = registerStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input pendaftaran staf gagal.',
        errors: validation.error.format(),
      });
    }

    const result = await authService.registerStaff(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Registrasi staf berhasil. Verifikasi email Anda, lalu tunggu persetujuan Admin.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Register Staff Controller Error:', error);

    if (error instanceof EmailAlreadyRegisteredError) {
      return res.status(error.code === 'EMAIL_NOT_VERIFIED_RESENT' ? 409 : 400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof RegistrationEmailError) {
      return res.status(502).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    const message = getErrorMessage(error);
    if (message.includes('sudah digunakan') || message.includes('tidak ditemukan')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses registrasi staf.',
    });
  }
}

export async function getTenants(_req: Request, res: Response) {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: tenants });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data toko.' });
  }
}

export async function getTenantOutlets(req: Request, res: Response) {
  try {
    const { tenantId } = req.params;
    const outlets = await prisma.outlet.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: outlets });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data outlet.' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const validation = verifyEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid.',
        errors: validation.error.format(),
      });
    }

    const result = await verifyEmailToken(validation.data.token);

    return res.status(200).json({
      success: true,
      message: 'Email berhasil diverifikasi. Anda dapat masuk ke akun.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Verify Email Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Verifikasi email gagal.'),
    });
  }
}

export async function resendVerification(req: Request, res: Response) {
  try {
    const validation = resendVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Email tidak valid.',
        errors: validation.error.format(),
      });
    }

    await resendVerificationEmail(validation.data.email);

    return res.status(200).json({
      success: true,
      message: 'Jika email terdaftar dan belum diverifikasi, tautan verifikasi telah dikirim.',
    });
  } catch (error: unknown) {
    console.error('Resend Verification Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal mengirim ulang email verifikasi.'),
    });
  }
}
