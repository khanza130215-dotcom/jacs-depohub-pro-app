import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { ActiveMenu } from '../types';
import { UserRole, getRoleMeta } from '../utils/rbac';

interface AccessRestrictedViewProps {
  currentRole: UserRole;
  attemptedMenu: ActiveMenu;
  onOpenRoleSwitcher: () => void;
  onFallbackToAllowedMenu: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  currentRole,
  attemptedMenu,
  onOpenRoleSwitcher,
  onFallbackToAllowedMenu,
}) => {
  const roleMeta = getRoleMeta(currentRole);

  const getMenuFriendlyName = (menu: ActiveMenu): string => {
    switch (menu) {
      case 'super-admin':
        return 'Super Admin 🔒 ROOT';
      case 'admin-dokumen':
        return 'Executive Manager & Keuangan VIP';
      case 'piutang':
        return 'Buku Piutang & Tagihan Toko';
      case 'dashboard':
        return 'Beranda (Pusat Operasional & Distribusi)';
      case 'maps-pelanggan':
        return 'Peta Radar & Lokasi Toko';
      case 'order':
        return 'Pelayanan Pesanan & Surat Jalan';
      default:
        return String(menu);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.25)] mb-5">
        <ShieldAlert className="w-10 h-10 animate-pulse" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-mono mb-3 shadow-xs">
        <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span className="text-slate-700 dark:text-slate-400 font-bold">Otoritas Menu:</span>
        <strong className="text-slate-950 dark:text-white font-black">{getMenuFriendlyName(attemptedMenu)}</strong>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight max-w-lg mb-2">
        Akses Dibatasi: Anda tidak memiliki izin untuk membuka fitur ini
      </h2>

      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-md leading-relaxed mb-6 font-medium">
        Modul ini diproteksi oleh kebijakan keamanan Depo. Tingkat otoritas aktif Anda saat ini adalah{' '}
        <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${roleMeta.bgClass}`}>
          {roleMeta.badgeText}
        </span>
        . Silakan beralih ke akun <strong>Owner Depo</strong> atau <strong>Developer</strong> untuk membuka modul ini.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onOpenRoleSwitcher}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 active:scale-95 transition-all cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span>🔑 Ganti Role / Buka Akses (PIN)</span>
        </button>

        <button
          type="button"
          onClick={onFallbackToAllowedMenu}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>⬅ Kembali ke Menu Kasir &amp; Admin</span>
        </button>
      </div>
    </div>
  );
};
