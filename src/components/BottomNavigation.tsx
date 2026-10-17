import React, { useState } from 'react';
import { ActiveMenu } from '../types';
import { MENU_ITEMS } from '../data/mockData';
import { useLanguage } from '../utils/i18n';
import {
  Home,
  Droplets,
  Truck,
  CreditCard,
  Menu,
  X,
  Store,
  MapPin,
  ClipboardList,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface BottomNavigationProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  allowedMenus?: ActiveMenu[];
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeMenu,
  onSelectMenu,
  allowedMenus,
}) => {
  const { t } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleSelect = (menu: ActiveMenu) => {
    onSelectMenu(menu);
    setIsDrawerOpen(false);
  };

  const isAllowed = (menuId: ActiveMenu) => {
    if (!allowedMenus || allowedMenus.length === 0) return true;
    return allowedMenus.includes(menuId);
  };

  return (
    <>
      {/* BOTTOM MOBILE APP BAR (VISIBLE ON SMALL SCREENS) */}
      <nav
        id="jacs-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1 shadow-2xl flex items-center justify-around"
      >
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeMenu === 'dashboard'
              ? 'text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-4 h-4 ${activeMenu === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="text-[9.5px] mt-0.5">{t('menu_dashboard', 'Beranda')}</span>
        </button>

        {/* Tab 2: Dual-Type Water & FMCG */}
        <button
          type="button"
          onClick={() => handleSelect('water_fmcg')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative cursor-pointer ${
            activeMenu === 'water_fmcg'
              ? 'text-cyan-300 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Droplets className={`w-4 h-4 ${activeMenu === 'water_fmcg' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <span className="text-[9.5px] mt-0.5 font-bold">Air &amp; Sembako</span>
        </button>

        {/* Tab 3: Sales & Distribusi (Driver Mobile) */}
        <button
          type="button"
          onClick={() => handleSelect('driver-mobile')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeMenu === 'driver-mobile'
              ? 'text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className={`w-4 h-4 ${activeMenu === 'driver-mobile' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="text-[9.5px] mt-0.5">NexaField</span>
        </button>

        {/* Tab 4: Kasir */}
        <button
          type="button"
          onClick={() => handleSelect('kasir')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeMenu === 'kasir'
              ? 'text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeMenu === 'kasir' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="text-[9.5px] mt-0.5">Kasir</span>
        </button>

        {/* Tab 5: Drawer Menu Lainnya */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all"
        >
          <Menu className="w-4 h-4 text-slate-400" />
          <span className="text-[9.5px] mt-0.5">Lainnya</span>
        </button>
      </nav>

      {/* MOBILE DRAWER MODAL / SHEET */}
      {isDrawerOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl max-h-[85vh] flex flex-col p-4 shadow-2xl text-slate-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-xs">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Menu DepoHub Pro
                  </h3>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Navigasi Cepat Seluruh Modul
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Menu List */}
            <div className="py-2.5 overflow-y-auto space-y-1.5 flex-1 custom-scrollbar">
              {/* Highlight Menu: Distribusi Air & Sembako (Dual-Type) */}
              <button
                type="button"
                onClick={() => handleSelect('water_fmcg')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeMenu === 'water_fmcg'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Distribusi Air &amp; Sembako</span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500 text-slate-950 shadow-xs">
                        Dual-Type
                      </span>
                    </div>
                    <span className="text-[9.5px] text-cyan-400 truncate block">
                      Depo Air RO &amp; FMCG Dual-Type
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>

              {/* Loop remaining MENU_ITEMS */}
              {MENU_ITEMS.filter((item) => item.id !== 'water_fmcg' && isAllowed(item.id)).map(
                (item) => {
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 border-cyan-500/60 text-white font-bold'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                          style={{
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                          }}
                        >
                          <i className={item.icon}></i>
                        </div>
                        <span className="text-xs font-semibold truncate">{getMenuLabel(item.id, item.label)}</span>
                      </div>
                      {item.badge && (
                        <span
                          className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-full border shrink-0"
                          style={{
                            borderColor: item.color,
                            color: item.color,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavigation;
