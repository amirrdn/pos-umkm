import { getRoleDisplayLabel, hasTenantWideOutletAccess } from './roles';
import type {
  OutletHierarchy,
  StaffFormFieldErrors,
  StaffFormState,
  StaffListQuery,
  StaffRole,
  StaffTab,
  StaffUser,
} from '../types/staffManagement';

export function mapStaffTabToApprovalStatus(tab: StaffTab): 'APPROVED' | 'PENDING' {
  return tab === 'active' ? 'APPROVED' : 'PENDING';
}

export function buildStaffListQuery(
  tab: StaffTab,
  searchQuery: string,
  roleFilter: string
): StaffListQuery {
  const query: StaffListQuery = {
    approvalStatus: mapStaffTabToApprovalStatus(tab),
  };

  const normalizedSearch = searchQuery.trim();
  if (normalizedSearch) {
    query.search = normalizedSearch;
  }

  if (roleFilter !== 'all') {
    query.roleName = roleFilter;
  }

  return query;
}

export function getStaffInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function getRoleBadgeClass(roleName: string): string {
  if (roleName === 'Admin') {
    return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  }
  if (roleName === 'Owner') {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  if (roleName === 'Manager') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (roleName === 'Staf Gudang') {
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }
  return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
}

export function findDefaultRole(roles: StaffRole[]): StaffRole | undefined {
  return roles.find((role) => role.name === 'Kasir') ?? roles[0];
}

export function findDefaultRoleId(roles: StaffRole[]): string {
  return findDefaultRole(roles)?.id ?? '';
}

export function hasOutletHierarchy(hierarchy: OutletHierarchy): boolean {
  return Boolean(hierarchy.main) || hierarchy.branches.length > 0;
}

export function createEmptyStaffForm(defaultRoleId: string): StaffFormState {
  return {
    name: '',
    email: '',
    password: '',
    roleId: defaultRoleId,
    outletIds: [],
  };
}

export function buildStaffFormFromUser(staff: StaffUser): StaffFormState {
  return {
    name: staff.name,
    email: staff.email,
    password: '',
    roleId: staff.userRoles[0]?.role.id || '',
    outletIds: staff.userOutlets ? staff.userOutlets.map((uo) => uo.outlet.id) : [],
  };
}

export function filterRolesBySearch(roles: StaffRole[], searchTerm: string): StaffRole[] {
  const query = searchTerm.toLowerCase();
  return roles.filter(
    (role) =>
      role.name.toLowerCase().includes(query) ||
      (role.description || '').toLowerCase().includes(query)
  );
}

export function isStaffManagementAllowed(roles: string[] | undefined): boolean {
  if (!roles) return false;
  return roles.includes('Owner') || roles.includes('Admin') || roles.includes('Manager');
}

export function formatStaffRegistrationDate(createdAt: string | undefined): string | null {
  if (!createdAt) {
    return null;
  }

  return new Date(createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function roleRequiresOutletAssignment(roleName: string): boolean {
  return !hasTenantWideOutletAccess([roleName]);
}

export function findStaffRoleById(roles: StaffRole[], roleId: string): StaffRole | undefined {
  return roles.find((role) => role.id === roleId);
}

export function hasStaffFormFieldErrors(errors: StaffFormFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateStaffAccountStep(
  form: StaffFormState,
  isEdit: boolean
): StaffFormFieldErrors {
  const errors: StaffFormFieldErrors = {};
  const trimmedName = form.name.trim();

  if (trimmedName.length < 2) {
    errors.name = 'Nama minimal 2 karakter.';
  }

  const trimmedEmail = form.email.trim();
  if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Format email tidak valid.';
  }

  if (!isEdit && form.password.length < 6) {
    errors.password = 'Kata sandi minimal 6 karakter.';
  }

  return errors;
}

export function validateStaffAccessStep(
  form: StaffFormState,
  roles: StaffRole[],
  outletHierarchy: OutletHierarchy
): StaffFormFieldErrors {
  const errors: StaffFormFieldErrors = {};
  const selectedRole = findStaffRoleById(roles, form.roleId);

  if (!selectedRole) {
    errors.roleId = 'Pilih peran untuk karyawan ini.';
    return errors;
  }

  if (
    roleRequiresOutletAssignment(selectedRole.name) &&
    hasOutletHierarchy(outletHierarchy) &&
    form.outletIds.length === 0
  ) {
    errors.outletIds = 'Pilih minimal satu outlet penempatan.';
  }

  return errors;
}

export interface StaffRoleGuide {
  title: string;
  description: string;
  accessSummary: string;
}

const STAFF_ROLE_GUIDE_COPY: Record<string, Pick<StaffRoleGuide, 'description' | 'accessSummary'>> = {
  Owner: {
    description: 'Pemilik toko dengan akses penuh ke semua fitur bisnis.',
    accessSummary: 'Laporan, billing, kelola staf, outlet, dan produk.',
  },
  Manager: {
    description: 'Pengelola operasional harian di seluruh cabang.',
    accessSummary: 'Dashboard, stok, shift, dan persetujuan permintaan internal.',
  },
  Kasir: {
    description: 'Staf front-line yang melayani transaksi penjualan.',
    accessSummary: 'POS, buka/tutup shift, dan riwayat transaksi outlet yang ditugaskan.',
  },
  'Staf Gudang': {
    description: 'Staf yang mengelola persediaan barang.',
    accessSummary: 'Mutasi stok, transfer barang, dan monitoring inventori outlet.',
  },
  Admin: {
    description: 'Admin platform SaaS dengan akses lintas tenant.',
    accessSummary: 'Panel platform, tenant, dan konfigurasi sistem.',
  },
};

export function buildStaffRoleGuide(role: StaffRole | undefined): StaffRoleGuide | null {
  if (!role) {
    return null;
  }

  const guideCopy = STAFF_ROLE_GUIDE_COPY[role.name];

  return {
    title: getRoleDisplayLabel(role.name),
    description: guideCopy?.description ?? role.description,
    accessSummary: guideCopy?.accessSummary ?? 'Hak akses mengikuti peran yang dipilih.',
  };
}
