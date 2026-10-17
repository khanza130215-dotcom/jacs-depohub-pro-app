export interface DepoBusinessProfile {
  name: string;
  address: string;
  nib: string;
  npwp: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

export const DEFAULT_DEPO_PROFILE: DepoBusinessProfile = {
  name: 'JacS DepoHub Subang',
  address: 'Jl. Raya Subang - Bandung KM 4.5, Sukamaju, Subang, Jawa Barat 41285',
  nib: '9120003482194',
  npwp: '01.892.482.3-409.000',
  phone: '0812-9988-7711',
  bankName: 'BCA (Bank Central Asia)',
  bankAccount: '8090-1234-5678',
  bankHolder: 'JacS DepoHub Official',
};

export const getDepoProfile = (): DepoBusinessProfile => {
  try {
    const saved = localStorage.getItem('jacs_depo_profile');
    if (saved) {
      return { ...DEFAULT_DEPO_PROFILE, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_DEPO_PROFILE;
};

export const saveDepoProfile = (profile: DepoBusinessProfile) => {
  try {
    localStorage.setItem('jacs_depo_profile', JSON.stringify(profile));
    localStorage.setItem('wa_setting_depo_name', profile.name);
    localStorage.setItem(
      'wa_setting_bank_account',
      `${profile.bankName} ${profile.bankAccount} (a/n ${profile.bankHolder})`
    );
  } catch {
    // ignore
  }
};

export const getSuperAdminPin = (): string => {
  try {
    return localStorage.getItem('jacs_super_admin_pin') || '9999';
  } catch {
    return '9999';
  }
};

export const setSuperAdminPin = (newPin: string): void => {
  try {
    localStorage.setItem('jacs_super_admin_pin', newPin.trim());
  } catch {
    // ignore
  }
};
