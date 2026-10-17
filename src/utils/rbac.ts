import { ActiveMenu } from '../types';
import { getManagerPin } from '../components/ManagerPinModal';
import { getMasterSuperAdmin } from './rootAuthority';

export type UserRole = 'DEVELOPER' | 'SUPER_ADMIN' | 'OWNER' | 'CASHIER';

export const STORAGE_KEY_USER_ROLE = 'jacs_current_user_role';

export const ROLE_DEFAULT_PINS = {
  DEVELOPER: '9999',
  SUPER_ADMIN: '9999',
  OWNER: '1234',
  CASHIER: '',
};

// Menu yang diizinkan untuk setiap Role
export const CASHIER_ALLOWED_MENUS: ActiveMenu[] = [
  'water_fmcg',
  'kasir',
  'sirkulasi-galon',
  'driver-mobile',
  'armada',
  'master-data',
  'hr',
  'whatsapp',
];

export const OWNER_ALLOWED_MENUS: ActiveMenu[] = [
  'dashboard',
  'water_fmcg',
  'admin-dokumen',
  'order',
  'maps-pelanggan',
  'kasir',
  'piutang',
  'armada',
  'driver-mobile',
  'sirkulasi-galon',
  'master-data',
  'whatsapp',
  'hr',
];

export const DEVELOPER_ALLOWED_MENUS: ActiveMenu[] = [
  'dashboard',
  'water_fmcg',
  'admin-dokumen',
  'order',
  'maps-pelanggan',
  'kasir',
  'piutang',
  'armada',
  'driver-mobile',
  'sirkulasi-galon',
  'master-data',
  'whatsapp',
  'hr',
  'super-admin',
];

export const getCurrentRole = (): UserRole => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER_ROLE);
    if (saved === 'DEVELOPER' || saved === 'SUPER_ADMIN' || saved === 'OWNER' || saved === 'CASHIER') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'CASHIER'; // Default role operasional kasir
};

export const setCurrentRole = (role: UserRole): void => {
  try {
    localStorage.setItem(STORAGE_KEY_USER_ROLE, role);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('user_role_changed'));
    }
  } catch {
    // ignore
  }
};

export const isMenuAllowed = (menu: ActiveMenu, role: UserRole): boolean => {
  switch (role) {
    case 'DEVELOPER':
    case 'SUPER_ADMIN':
      return DEVELOPER_ALLOWED_MENUS.includes(menu);
    case 'OWNER':
      return OWNER_ALLOWED_MENUS.includes(menu);
    case 'CASHIER':
      return CASHIER_ALLOWED_MENUS.includes(menu);
    default:
      return CASHIER_ALLOWED_MENUS.includes(menu);
  }
};

export const getAllowedMenus = (role: UserRole): ActiveMenu[] => {
  switch (role) {
    case 'DEVELOPER':
    case 'SUPER_ADMIN':
      return DEVELOPER_ALLOWED_MENUS;
    case 'OWNER':
      return OWNER_ALLOWED_MENUS;
    case 'CASHIER':
      return CASHIER_ALLOWED_MENUS;
    default:
      return CASHIER_ALLOWED_MENUS;
  }
};

export const validateRolePin = (targetRole: UserRole, inputPin: string): boolean => {
  const trimmedPin = inputPin.trim();

  if (targetRole === 'CASHIER') {
    return true; // Tidak memerlukan PIN
  }

  if (targetRole === 'OWNER') {
    // Validasi PIN '1234' atau PIN Manager kustom jika pernah diatur
    const customManagerPin = getManagerPin ? getManagerPin() : '1234';
    return trimmedPin === '1234' || trimmedPin === customManagerPin;
  }

  if (targetRole === 'DEVELOPER' || targetRole === 'SUPER_ADMIN') {
    // Validasi PIN '9999' atau PIN Master Root jika pernah dibuat
    const masterAdmin = getMasterSuperAdmin();
    const customRootPin = masterAdmin?.pin;
    return trimmedPin === '9999' || trimmedPin === customRootPin;
  }

  return false;
};

export const getRoleMeta = (role: UserRole) => {
  switch (role) {
    case 'DEVELOPER':
    case 'SUPER_ADMIN':
      return {
        name: 'Developer ROOT',
        badgeText: '[Role: Developer ROOT]',
        shortLabel: 'Developer',
        bgClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-900 [body.light-theme_&]:border-rose-300',
        dotColor: 'bg-rose-400',
        desc: 'Akses tak terbatas ke SELURUH modul sistem dan Super Admin 🔒 ROOT.',
      };
    case 'OWNER':
      return {
        name: 'Owner Depo',
        badgeText: '[Role: Owner Depo]',
        shortLabel: 'Owner Depo',
        bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border-amber-300',
        dotColor: 'bg-amber-400',
        desc: 'Akses manajemen eksekutif penuh, buku piutang, dan cockpit depo (kecuali Super Admin ROOT).',
      };
    case 'CASHIER':
    default:
      return {
        name: 'Admin Kasir',
        badgeText: '[Role: Admin Kasir]',
        shortLabel: 'Admin Kasir',
        bgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-300',
        dotColor: 'bg-emerald-400',
        desc: 'Akses operasional harian: Kasir POS, Sirkulasi Galon, Driver POD, Armada, Master Data, SDM, WhatsApp.',
      };
  }
};
