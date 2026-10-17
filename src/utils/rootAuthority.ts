export interface MasterSuperAdmin {
  ownerName: string;
  masterEmail: string;
  pin: string; // 6 digit PIN
  licenseKey: string;
  licenseTier: 'Enterprise Lifetime Pro' | 'Depo Unlimited Root';
  registeredAt: string;
  isConfigured: boolean;
  hardwareFingerprint?: string;
  recoveryCode?: string;
}

export interface SecurityAuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

const STORAGE_KEY = 'jacs_master_super_admin';
const LOGS_KEY = 'jacs_security_audit_logs';

/**
 * Generate a consistent browser fingerprint for license anchoring
 */
export const getHardwareFingerprint = (): string => {
  try {
    const nav = window.navigator;
    const screen = window.screen;
    const str = `${nav.userAgent}-${screen.width}x${screen.height}-${nav.language}-${screen.colorDepth}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `HWID-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  } catch {
    return 'HWID-LOCAL-DEF90';
  }
};

/**
 * Generate a formatted enterprise license key
 */
export const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `JACS-ROOT-${segment(4)}-${segment(4)}-${segment(4)}`;
};

/**
 * Check if Master Super Admin has been configured
 */
export const hasMasterSuperAdmin = (): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.isConfigured && parsed.pin && parsed.pin.length >= 4);
  } catch {
    return false;
  }
};

/**
 * Get current Master Super Admin record
 */
export const getMasterSuperAdmin = (): MasterSuperAdmin | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MasterSuperAdmin;
  } catch {
    return null;
  }
};

/**
 * Save / Initialize Master Super Admin
 */
export const saveMasterSuperAdmin = (
  data: Partial<MasterSuperAdmin> & { pin: string; ownerName: string; masterEmail: string }
): MasterSuperAdmin => {
  const existing = getMasterSuperAdmin();
  const licenseKey = existing?.licenseKey || generateLicenseKey();
  const hardwareFingerprint = existing?.hardwareFingerprint || getHardwareFingerprint();
  const recoveryCode =
    existing?.recoveryCode || `REC-${Math.floor(100000 + Math.random() * 900000)}`;

  const record: MasterSuperAdmin = {
    ownerName: data.ownerName.trim(),
    masterEmail: data.masterEmail.trim().toLowerCase(),
    pin: data.pin.trim(),
    licenseKey,
    licenseTier: data.licenseTier || 'Enterprise Lifetime Pro',
    registeredAt: existing?.registeredAt || new Date().toISOString(),
    isConfigured: true,
    hardwareFingerprint,
    recoveryCode,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    // Sync with legacy pin storage key as well
    localStorage.setItem('jacs_super_admin_pin', record.pin);
    logMasterAdminAction('SETUP_MASTER_ROOT', `Otoritas root diinisialisasi atas nama ${record.ownerName}`, 'critical');
  } catch (err) {
    console.error('Failed to save master super admin:', err);
  }

  return record;
};

/**
 * Verify input PIN against Master Super Admin PIN
 */
export const verifySuperAdminPin = (inputPin: string): boolean => {
  const master = getMasterSuperAdmin();
  if (master && master.pin) {
    return master.pin === inputPin.trim();
  }
  // Fallback to legacy key
  const legacyPin = localStorage.getItem('jacs_super_admin_pin') || '9999';
  return legacyPin === inputPin.trim();
};

/**
 * Update Super Admin PIN
 */
export const updateMasterSuperAdminPin = (newPin: string): boolean => {
  const cleanPin = newPin.trim();
  if (cleanPin.length < 4) return false;

  const current = getMasterSuperAdmin();
  if (current) {
    current.pin = cleanPin;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  localStorage.setItem('jacs_super_admin_pin', cleanPin);
  logMasterAdminAction('CHANGE_ROOT_PIN', 'PIN Keamanan Root berhasil diperbarui', 'warning');
  return true;
};

/**
 * Audit Logging for Super Admin actions
 */
export const logMasterAdminAction = (
  action: string,
  details: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
) => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    const logs: SecurityAuditLog[] = raw ? JSON.parse(raw) : [];
    const newEntry: SecurityAuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      severity,
    };
    logs.unshift(newEntry);
    // Keep max 100 logs
    if (logs.length > 100) logs.pop();
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch {
    // ignore
  }
};

/**
 * Retrieve Audit Logs
 */
export const getMasterAdminAuditLogs = (): SecurityAuditLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
