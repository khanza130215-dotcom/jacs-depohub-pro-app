import React, { useState } from 'react';
import { ActiveMenu } from '../types';
import { MENU_ITEMS } from '../data/mockData';
import { useLanguage } from '../utils/i18n';
import { UserRole, isMenuAllowed, getRoleMeta } from '../utils/rbac';
import {
  Droplets,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  KeyRound,
  LogOut,
  Info,
} from 'lucide-react';
import { SyncStatus } from '../utils/cloudSync';

interface SidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  onOpenCodeModal?: () => void;
  onOpenAboutModal?: () => void;
  logoUrl?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTempoCount?: number;
  activeOrdersCount?: number;
  activeArmadaCount?: number;
  syncStatus?: SyncStatus;
  isManagerUnlocked?: boolean;
  isSuperAdminUnlocked?: boolean;
  isKasirUnlocked?: boolean;
  isPiutangUnlocked?: boolean;
  currentRole?: UserRole;
  onOpenRoleModal?: () => void;
  onExitToNormalMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onOpenCodeModal,
  onOpenAboutModal,
  logoUrl,
  isCollapsed = false,
  onToggleCollapse,
  activeTempoCount,
  activeOrdersCount,
  activeArmadaCount,
  syncStatus = 'offline',
  isManagerUnlocked = false,
  isSuperAdminUnlocked = false,
  isKasirUnlocked = false,
  isPiutangUnlocked = false,
  currentRole = 'CASHIER',
  onOpenRoleModal,
  onExitToNormalMode,
}) => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Compute effective logo URL (respects empty string for fallback badge)
  const effectiveLogo =
    logoUrl !== undefined
      ? logoUrl
      : typeof window !== 'undefined'
      ? (localStorage.getItem('jacs_logo_url') ?? '/logo-jacs.svg')
      : '/logo-jacs.svg';

  // Reset img error if logoUrl prop changes
  React.useEffect(() => {
    setImgError(false);
  }, [effectiveLogo]);

  const getMenuLabel = (id: ActiveMenu, fallback: string) => {
    switch (id) {
      case 'dashboard':
        return t('menu_dashboard', 'Beranda');
      case 'order':
        return t('menu_order', fallback);
      case 'maps-pelanggan':
        return t('menu_maps', fallback);
      case 'kasir':
        return t('menu_kasir', fallback);
      case 'piutang':
        return t('menu_piutang', 'Buku Piutang & Tempo');
      case 'armada':
        return t('menu_armada', 'Manajemen Armada');
      case 'driver-mobile':
        return t('menu_driver_mobile', fallback);
      case 'water_fmcg':
        return t('water_fmcg_title', 'Distribusi Air & Sembako');
      case 'sirkulasi-galon':
        return t('menu_sirkulasi', 'Sirkulasi Wadah & Aset');
      case 'master-data':
        return t('menu_master', fallback);
      case 'whatsapp':
        return t('menu_whatsapp', fallback);
      case 'hr':
        return t('menu_hr', fallback);
      case 'admin-dokumen':
        return t('menu_admin', fallback);
      case 'super-admin':
        return t('menu_super_admin', fallback);
      default:
        return fallback;
    }
  };

  const getMenuBadge = (id: ActiveMenu, fallback?: string) => {
    const isRootBypassed = currentRole === 'DEVELOPER' || currentRole === 'SUPER_ADMIN' || isSuperAdminUnlocked;
    const effectiveKasirUnlocked = isRootBypassed || isKasirUnlocked;
    const effectivePiutangUnlocked = isRootBypassed || isPiutangUnlocked;

    if (id === 'admin-dokumen') {
      return isRootBypassed || isManagerUnlocked ? '🔓 TERBUKA' : '🔒 PIN';
    }
    if (id === 'super-admin') {
      return isRootBypassed ? '🔓 ROOT' : isSuperAdminUnlocked ? '🔓 TERBUKA' : '🔒 ROOT';
    }
    if (id === 'kasir') {
      return effectiveKasirUnlocked ? (isRootBypassed ? '🔓 ROOT' : '🔓 TERBUKA') : '🔒 PIN';
    }
    if (id === 'piutang') {
      if (!effectivePiutangUnlocked) {
        return '🔒 PIN';
      }
      if (typeof activeTempoCount === 'number') {
        return `${activeTempoCount} Tempo`;
      }
      return isRootBypassed ? '🔓 ROOT' : t('menu_piutang_badge', fallback || '1 Tempo');
    }
    if (id === 'order') {
      if (typeof activeOrdersCount === 'number') {
        return `${activeOrdersCount} Baru`;
      }
      return t('menu_order_badge', fallback || '1 Baru');
    }
    if (id === 'armada') {
      const count = typeof activeArmadaCount === 'number' ? activeArmadaCount : 0;
      return `${count} Jalan`;
    }

    // Seluruh sub-judul/badge statis (Dual-Type, NexaField, 12 Staf, Radar Live, dll.) dibersihkan
    return undefined;
  };

  return (
    <aside
      id="jacs-sidebar"
      className={`bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen max-h-screen shrink-0 backdrop-blur-xl z-30 select-none transition-all duration-300 ease-in-out [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 ${
        isCollapsed ? 'w-16' : 'w-60 lg:w-64'
      }`}
    >
      {/* Brand Header with JacS Logo & Fallback Badge */}
      <div className="px-3 py-2 border-b border-slate-800/70 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0 h-14">
        <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'mx-auto' : ''}`}>
          {effectiveLogo && !imgError ? (
            <img
              src={effectiveLogo}
              alt="JacS Enterprise Logo"
              onError={() => setImgError(true)}
              className="w-10 h-10 object-contain rounded-lg shrink-0 border border-slate-700/60 [body.light-theme_&]:border-slate-300 bg-slate-900/60 [body.light-theme_&]:bg-white p-0.5 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-blue-600 p-[1.5px] shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 [body.light-theme_&]:bg-white rounded-[6px] flex flex-col items-center justify-center leading-none">
                <span className="text-[12px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 font-mono tracking-tighter">
                  JacS
                </span>
                <span className="text-[6.5px] font-bold text-slate-400 [body.light-theme_&]:text-slate-500 tracking-widest uppercase">
                  PRO
                </span>
              </div>
            </div>
          )}
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="text-sm font-black tracking-tight text-white [body.light-theme_&]:text-slate-900 leading-none">
                OmniFlow Hub
              </h1>
            </div>
          )}
        </div>

        {!isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900 hover:bg-slate-800 [body.light-theme_&]:hover:bg-slate-100 transition-colors cursor-pointer"
            title="Ciutkan Sidebar ke Rail Mode"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav List - Filtered by Active Role with Solid 1.5px Border, 4px Left Strip and 15px Cyber-Glow */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 space-y-1.5">
        {MENU_ITEMS.filter((item) => isMenuAllowed(item.id, currentRole || 'CASHIER')).map((item) => {
          const isActive = activeMenu === item.id;
          const isHovered = hoveredId === item.id;
          const label = getMenuLabel(item.id, item.label);
          const badge = getMenuBadge(item.id, item.badge);

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectMenu(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-1' : 'justify-between px-2.5'
              } py-2 text-xs font-semibold group cursor-pointer transition-all duration-150 rounded-lg border-[1.5px] ${
                isActive
                  ? 'border-slate-700/80 border-l-4 border-l-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.45)] [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:text-cyan-950 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:border-l-cyan-500'
                  : 'border-slate-800 [body.light-theme_&]:border-slate-300 text-slate-400 [body.light-theme_&]:text-slate-700 hover:text-cyan-200 [body.light-theme_&]:hover:text-cyan-950 hover:bg-slate-900/90 [body.light-theme_&]:hover:bg-sky-50 hover:border-l-4 hover:border-l-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.45)] hover:border-cyan-500/60 [body.light-theme_&]:hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Icon Container */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-800'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 group-hover:text-cyan-300 group-hover:border-cyan-400/40 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-200'
                  }`}
                >
                  {item.id === 'water_fmcg' ? (
                    <Droplets className="w-3.5 h-3.5" />
                  ) : (
                    <i className={item.icon}></i>
                  )}
                </div>

                {!isCollapsed && (
                  <span className="tracking-tight truncate text-[11.5px] leading-tight">
                    {label}
                  </span>
                )}
              </div>

              {!isCollapsed && badge && (() => {
                const isZeroArmada =
                  item.id === 'armada' &&
                  (typeof activeArmadaCount === 'number' ? activeArmadaCount : 0) === 0;

                if (isZeroArmada) {
                  return (
                    <span
                      id="badge-sidebar-armada-neutral"
                      className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 tracking-wide border transition-all bg-slate-800/80 text-slate-400 border-slate-700/80 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-600 [body.light-theme_&]:border-slate-300"
                    >
                      {badge}
                    </span>
                  );
                }

                return (
                  <span
                    className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full shrink-0 tracking-wide border transition-all"
                    style={{
                      backgroundColor: isActive ? item.color : `${item.color}25`,
                      color: isActive ? '#0f172a' : item.color,
                      borderColor: item.color,
                      boxShadow: isActive ? `0 0 10px ${item.color}` : undefined,
                    }}
                  >
                    {badge}
                  </span>
                );
              })()}
            </button>
          );
        })}
      </div>

      {/* Role Indicator & Quick Switcher + Exit Normal Shortcut */}
      <div className="px-2 pt-1 shrink-0 space-y-1">
        <button
          type="button"
          id="btn-sidebar-switch-role"
          onClick={onOpenRoleModal}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
          } rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs ${
            getRoleMeta(currentRole || 'CASHIER').bgClass
          }`}
          title="Klik untuk membuka pemilih role / switch otoritas akun"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full ${
                getRoleMeta(currentRole || 'CASHIER').dotColor
              } shrink-0 animate-pulse`}
            ></span>
            {!isCollapsed && (
              <span className="text-[10px] font-black truncate">
                {getRoleMeta(currentRole || 'CASHIER').badgeText}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[9px] font-sans font-bold flex items-center gap-0.5 opacity-90 underline">
              <KeyRound className="w-2.5 h-2.5" />
              <span>Ganti</span>
            </span>
          )}
        </button>

        {/* Tombol Shortcut Cepat Exit Normal saat Role Developer ROOT atau Super Admin aktif */}
        {(currentRole === 'DEVELOPER' || currentRole === 'OWNER' || isSuperAdminUnlocked) && onExitToNormalMode && (
          <button
            type="button"
            id="btn-sidebar-exit-normal"
            onClick={onExitToNormalMode}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-center gap-1.5 px-2 py-1'
            } rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 hover:border-emerald-400 text-emerald-300 text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-sm [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-300`}
            title="Keluar / Exit ke Mode Normal Operasional (Kasir POS)"
          >
            <LogOut className="w-3 h-3 text-emerald-400 shrink-0" />
            {!isCollapsed && <span>🚪 Exit Normal</span>}
          </button>
        )}
      </div>

      {/* Depo Status Footer */}
      <div className="p-2 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200 shrink-0 space-y-1.5">
        <div
          className={`p-2 rounded-lg bg-slate-900/80 [body.light-theme_&]:bg-slate-100 border-[1.5px] border-slate-800 [body.light-theme_&]:border-slate-300 flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-slate-200 [body.light-theme_&]:text-slate-800 leading-none">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                {t('depo_buka', 'DEPO BUKA')}
              </div>
              <div className="text-[9px] font-mono text-slate-400 [body.light-theme_&]:text-slate-500 mt-1">
                {t('depo_hours', '07.00 - 17.00 WIB')}
              </div>
            </div>
          ) : (
            <span className="relative flex h-2 w-2" title={`${t('depo_buka', 'DEPO BUKA')} ${t('depo_hours', '07.00 - 17.00 WIB')}`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}

          {!isCollapsed && (
            <div className="w-6 h-6 rounded-md bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Tombol & Informasi Tentang Aplikasi (JacS Enterprise v2.0 Pro Edition) */}
        <button
          type="button"
          id="btn-sidebar-about-app"
          onClick={onOpenAboutModal}
          className={`w-full cursor-pointer transition-all group rounded-lg border text-left active:scale-95 shadow-xs ${
            isCollapsed ? 'p-1.5 flex justify-center' : 'p-2'
          } bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-amber-400/60 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 [body.light-theme_&]:border-slate-300`}
          title="Klik untuk membuka info Tentang Aplikasi & Panduan SOP"
        >
          {!isCollapsed ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-300 [body.light-theme_&]:text-amber-800 group-hover:text-amber-200 transition-colors">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Tentang Aplikasi</span>
                </span>
                <span className="text-[8.5px] font-mono text-cyan-400 [body.light-theme_&]:text-cyan-700 font-bold px-1.5 py-0.2 rounded bg-cyan-950/60 [body.light-theme_&]:bg-cyan-100 border border-cyan-800/50 [body.light-theme_&]:border-cyan-300">
                  v2.0 Pro
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 shrink-0"></span>
                <span className="truncate">
                  Developed by <strong className="text-white [body.light-theme_&]:text-slate-900 font-bold">JacS Enterprise</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg flex flex-col items-center justify-center text-amber-400 hover:text-amber-300" title="Tentang Aplikasi (JacS Enterprise v2.0 Pro)">
              <Info className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
