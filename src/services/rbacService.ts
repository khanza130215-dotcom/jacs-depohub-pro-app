/**
 * NexaHub RBAC Service
 * Role-Based Access Control for super_admin, warehouse_supervisor, and field_driver_sales
 */

import { ActiveMenu } from '../types';
import { UserRole } from '../utils/rbac';

export type NexaSystemRole = 'super_admin' | 'warehouse_supervisor' | 'field_driver_sales';

export interface RolePermissionConfig {
  roleId: NexaSystemRole;
  roleLabel: string;
  description: string;
  allowedMenus: ActiveMenu[];
}

export const ROLE_PERMISSIONS: Record<NexaSystemRole, RolePermissionConfig> = {
  super_admin: {
    roleId: 'super_admin',
    roleLabel: 'Super Admin Depo',
    description: 'Akses penuh seluruh modul, audit finansial, kontrol kuota galon, dan konfigurasi sistem.',
    allowedMenus: [
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
    ],
  },
  warehouse_supervisor: {
    roleId: 'warehouse_supervisor',
    roleLabel: 'Supervisor Gudang & Logistik',
    description: 'Manajemen stok air RO & sembako FMCG, sirkulasi tabung galon, dan pengawasan armada ritase.',
    allowedMenus: [
      'dashboard',
      'water_fmcg',
      'order',
      'maps-pelanggan',
      'kasir',
      'piutang',
      'armada',
      'sirkulasi-galon',
      'master-data',
      'driver-mobile',
      'whatsapp',
    ],
  },
  field_driver_sales: {
    roleId: 'field_driver_sales',
    roleLabel: 'Field Driver & Kanvas Sales',
    description: 'Aplikasi lapangan penjualan spot, re-visit drop galon & sembako, dan penagihan tempo di rute toko.',
    allowedMenus: [
      'water_fmcg',
      'driver-mobile',
      'kasir',
      'sirkulasi-galon',
      'armada',
      'maps-pelanggan',
      'whatsapp',
    ],
  },
};

/**
 * Mapping helper dari UserRole lama (DEVELOPER, OWNER, CASHIER) ke NexaSystemRole
 */
export function mapLegacyRoleToNexaRole(legacyRole: UserRole): NexaSystemRole {
  switch (legacyRole) {
    case 'DEVELOPER':
      return 'super_admin';
    case 'OWNER':
      return 'warehouse_supervisor';
    case 'CASHIER':
      return 'field_driver_sales';
    default:
      return 'field_driver_sales';
  }
}

/**
 * Validasi apakah role tertentu diizinkan mengakses menu
 */
export function isNexaRoleAllowed(role: NexaSystemRole | UserRole | string, menuId: ActiveMenu): boolean {
  if (role === 'DEVELOPER' || role === 'super_admin') return true;

  if (role === 'OWNER' || role === 'warehouse_supervisor') {
    return ROLE_PERMISSIONS.warehouse_supervisor.allowedMenus.includes(menuId);
  }

  if (role === 'CASHIER' || role === 'field_driver_sales') {
    return ROLE_PERMISSIONS.field_driver_sales.allowedMenus.includes(menuId);
  }

  const nexaRole = ROLE_PERMISSIONS[role as NexaSystemRole];
  if (nexaRole) {
    return nexaRole.allowedMenus.includes(menuId);
  }

  return false;
}

export const rbacService = {
  getPermissions: (role: NexaSystemRole) => ROLE_PERMISSIONS[role],
  isAllowed: isNexaRoleAllowed,
  mapLegacy: mapLegacyRoleToNexaRole,
};
