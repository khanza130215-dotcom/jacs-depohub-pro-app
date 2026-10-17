import React, { useState } from 'react';
import { ActiveMenu } from '../types';
import { MENU_ITEMS } from '../data/mockData';
import { useLanguage } from '../utils/i18n';
import { UserRole, isMenuAllowed, getRoleMeta } from '../utils/rbac';
import {
  Droplets,
  PanelLeftClose,
  PanelLeft,
  Code,
  ShieldCheck,
  Cloud,
  CloudOff,
  UserCog,
  KeyRound,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { SyncStatus } from '../utils/cloudSync';

export interface DesktopSidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  onOpenCodeModal: () => void;
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

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
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

  const effectiveLogo =
    logoUrl !== undefined
      ? logoUrl
      : 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=120&q=80';

  const getMenuBadge = (id: ActiveMenu, originalBadge?: string): string | undefined => {
    const isRootBypassed = currentRole === 'DEVELOPER' || currentRole === 'SUPER_ADMIN' || isSuperAdminUnlocked;
    const effectiveKasirUnlocked = isRootBypassed || isKasirUnlocked;
    const effectivePiutangUnlocked = isRootBypassed || isPiutangUnlocked;

    if (id === 'water_fmcg') {
      return 'Dual-Type';
    }
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
      return activeTempoCount && activeTempoCount > 0
        ? `${activeTempoCount} Tempo`
        : (isRootBypassed ? '🔓 ROOT' : originalBadge || '🔓 TERBUKA');
    }
    if (id === 'order') {
      return activeOrdersCount && activeOrdersCount > 0
        ? `${activeOrdersCount} Baru`
        : originalBadge;
    }
    if (id === 'armada') {
      return activeArmadaCount && activeArmadaCount > 0
        ? `${activeArmadaCount} Jalan`
        : originalBadge;
    }
    return originalBadge;
  };

  const getMenuLabel = (id: ActiveMenu, fallback: string): string => {
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

  return (
    <aside
      id="jacs-desktop-sidebar"
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen shrink-0 transition-all duration-200 select-none z-30 sticky top-0`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 p-0.5 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center">
            {effectiveLogo && !imgError ? (
              <img
                src={effectiveLogo}
                alt="Logo"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Droplets className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            )}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-white tracking-wider truncate">
                  OmniFlow Hub
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0">
                  Pro
                </span>
              </div>
              <p className="text-[8.5px] font-mono text-cyan-400 font-bold uppercase truncate">
                DISTRIBUTION &amp; FLEET LOGISTICS
              </p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center justify-center cursor-pointer transition-all"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {/* Menu Khusus: Distribusi Air & Sembako (Dual-Type) */}
        {(() => {
          const isActive = activeMenu === 'water_fmcg';
          return (
            <button
              type="button"
              onClick={() => onSelectMenu('water_fmcg')}
              onMouseEnter={() => setHoveredId('water_fmcg')}
              onMouseLeave={() => setHoveredId(null)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-1' : 'justify-between px-2.5'
              } py-2 text-xs font-semibold group cursor-pointer transition-all duration-150 rounded-xl border ${
                isActive
                  ? 'border-cyan-400/80 border-l-4 border-l-cyan-400 bg-cyan-500/20 text-cyan-200 font-bold shadow-[0_0_16px_rgba(6,182,212,0.4)]'
                  : 'border-cyan-500/20 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-900 hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/30 group-hover:scale-105'
                  }`}
                >
                  <Droplets className="w-4 h-4 stroke-[2.5]" />
                </div>

                {!isCollapsed && (
                  <div className="text-left min-w-0">
                    <span className="tracking-tight truncate text-[11.5px] leading-tight block font-bold text-white">
                      Distribusi Air &amp; Sembako
                    </span>
                    <span className="text-[8.5px] font-mono text-cyan-400 block truncate">
                      Depo Air RO &amp; FMCG Dual-Type
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <span className="text-[8.5px] font-mono font-black px-1.5 py-0.2 rounded-full shrink-0 tracking-wide bg-cyan-400 text-slate-950 border border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.7)] uppercase animate-pulse">
                  Dual-Type
                </span>
              )}
            </button>
          );
        })()}

        {/* Separator Line */}
        <div className="pt-1 pb-1">
          <div className="border-t border-slate-800/80" />
        </div>

        {/* Existing MENU_ITEMS */}
        {MENU_ITEMS.filter((item) => item.id !== 'water_fmcg').map((item) => {
          if (!isMenuAllowed(item.id, currentRole)) {
            return null;
          }

          const isActive = activeMenu === item.id;
          const label = getMenuLabel(item.id, item.label);
          const badge = getMenuBadge(item.id, item.badge);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMenu(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-1' : 'justify-between px-2.5'
              } py-2 text-xs font-semibold group cursor-pointer transition-all duration-150 rounded-lg border ${
                isActive
                  ? 'border-slate-700 border-l-4 border-l-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  : 'border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 transition-all ${
                    isActive
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 group-hover:text-cyan-300'
                  }`}
                >
                  <i className={item.icon}></i>
                </div>

                {!isCollapsed && (
                  <span className="tracking-tight truncate text-[11.5px] leading-tight">
                    {label}
                  </span>
                )}
              </div>

              {!isCollapsed && badge && (
                <span
                  className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full shrink-0 tracking-wide border transition-all"
                  style={{
                    backgroundColor: isActive ? item.color : `${item.color}25`,
                    color: isActive ? '#0f172a' : item.color,
                    borderColor: item.color,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Switcher */}
      <div className="px-2 pt-1 shrink-0">
        <button
          type="button"
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
                currentRole === 'DEVELOPER'
                  ? 'bg-cyan-400 animate-pulse'
                  : currentRole === 'OWNER'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            {!isCollapsed && (
              <span className="truncate text-[10.5px]">
                {getRoleMeta(currentRole || 'CASHIER').name}
              </span>
            )}
          </div>
          {!isCollapsed && <UserCog className="w-3.5 h-3.5 opacity-80" />}
        </button>

        {/* Shortcut Exit Normal saat Role Developer ROOT atau Super Admin aktif */}
        {(currentRole === 'DEVELOPER' || currentRole === 'OWNER' || isSuperAdminUnlocked) && onExitToNormalMode && (
          <button
            type="button"
            onClick={onExitToNormalMode}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-center gap-1.5 px-2 py-1'
            } rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 hover:border-emerald-400 text-emerald-300 text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-sm mt-1`}
            title="Keluar / Exit ke Mode Normal Operasional (Kasir POS)"
          >
            <LogOut className="w-3 h-3 text-emerald-400 shrink-0" />
            {!isCollapsed && <span>🚪 Exit Normal</span>}
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-slate-800/80 shrink-0 text-[10px] text-slate-400 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[9px] text-emerald-300">Dual-Type Online</span>
          </div>
        )}
        {onOpenAboutModal && (
          <button
            type="button"
            onClick={onOpenAboutModal}
            className="text-[9.5px] hover:text-cyan-300 transition-colors cursor-pointer"
          >
            v2.6.4
          </button>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
