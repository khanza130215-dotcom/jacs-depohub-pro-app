import React, { useState, useEffect, useRef } from 'react';
import { ActiveMenu, ProductMasterItem } from '../types';
import { useLanguage } from '../utils/i18n';
import { UserRole } from '../utils/rbac';
import {
  Sun,
  Moon,
  Clock,
  PanelLeftClose,
  PanelLeft,
  Droplets,
  Camera,
} from 'lucide-react';

interface HeaderProps {
  activeMenu: ActiveMenu;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenOrderModal?: () => void;
  onOpenCodeModal?: () => void;
  onOpenAboutModal?: () => void;
  onRefresh?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onSelectMenu?: (menu: ActiveMenu) => void;
  allowMultiDrop?: boolean;
  onToggleMultiDrop?: () => void;
  onOpenSettlement?: () => void;
  currentRole?: UserRole;
  onOpenRoleModal?: () => void;
  onExitToNormalMode?: () => void;
  products?: ProductMasterItem[];
}

interface FeatureProfileInfo {
  initials: string;
  name: string;
  gradient: string;
}

const getFeatureProfileInfo = (menu: ActiveMenu): FeatureProfileInfo => {
  switch (menu) {
    case 'master-data':
      return {
        initials: 'MDP',
        name: 'Master Data Produk',
        gradient: 'from-violet-600 to-purple-600',
      };
    case 'kasir':
      return {
        initials: 'KAD',
        name: 'Kasir & Admin Depo',
        gradient: 'from-emerald-600 to-teal-600',
      };
    case 'sirkulasi-galon':
      return {
        initials: 'SWA',
        name: 'Sirkulasi Wadah & Aset',
        gradient: 'from-cyan-600 to-teal-600',
      };
    case 'dashboard':
      return {
        initials: 'POD',
        name: 'Pusat Distribusi',
        gradient: 'from-blue-600 to-indigo-600',
      };
    case 'order':
      return {
        initials: 'PPS',
        name: 'Pelayanan Pesanan',
        gradient: 'from-teal-600 to-emerald-600',
      };
    case 'maps-pelanggan':
      return {
        initials: 'PTP',
        name: 'Data Peta Toko',
        gradient: 'from-sky-600 to-blue-600',
      };
    case 'armada':
      return {
        initials: 'MAR',
        name: 'Manajemen Armada',
        gradient: 'from-amber-600 to-orange-600',
      };
    case 'piutang':
      return {
        initials: 'BPT',
        name: 'Buku Piutang & Tempo',
        gradient: 'from-rose-600 to-pink-600',
      };
    case 'whatsapp':
      return {
        initials: 'IWA',
        name: 'Integrasi WhatsApp',
        gradient: 'from-emerald-600 to-green-600',
      };
    case 'hr':
      return {
        initials: 'SDM',
        name: 'SDM & HR Depo',
        gradient: 'from-blue-600 to-cyan-600',
      };
    case 'admin-dokumen':
      return {
        initials: 'EXM',
        name: 'Executive Manager',
        gradient: 'from-indigo-600 to-violet-600',
      };
    case 'super-admin':
      return {
        initials: 'SAR',
        name: 'Super Admin Root',
        gradient: 'from-rose-600 to-red-600',
      };
    case 'driver-mobile':
      return {
        initials: 'SAD',
        name: 'Sales & Distribusi',
        gradient: 'from-orange-600 to-amber-600',
      };
    case 'water_fmcg':
      return {
        initials: 'DAS',
        name: 'Distribusi Sembako',
        gradient: 'from-cyan-600 to-sky-600',
      };
    default:
      return {
        initials: 'OFH',
        name: 'OmniFlow Hub',
        gradient: 'from-cyan-600 to-blue-600',
      };
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeMenu,
  isDarkMode,
  onToggleTheme,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [customProfilePhoto, setCustomProfilePhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem('jacs_custom_profile_photo');
    } catch {
      return null;
    }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format jam sesuai zona waktu depo Makassar WITA (UTC+8 / Asia/Makassar) format HH:mm WITA
      const timeStr = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setCurrentTime(timeStr.replace('.', ':') + ' WITA');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomProfilePhoto(dataUrl);
      try {
        localStorage.setItem('jacs_custom_profile_photo', dataUrl);
      } catch (err) {
        console.error('[Header] Gagal menyimpan foto profil ke localStorage:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomProfilePhoto(null);
    try {
      localStorage.removeItem('jacs_custom_profile_photo');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('[Header] Gagal menghapus foto profil:', err);
    }
  };

  const getPageTitle = (menu: ActiveMenu) => {
    switch (menu) {
      case 'dashboard':
        return {
          title: t('cockpit_title', 'Pusat Operasional & Distribusi'),
          desc: t('cockpit_desc', 'Pantauan Langsung Stok Galon 19L, Sirkulasi & Penjualan Dus'),
        };
      case 'order':
        return {
          title: t('order_title', 'Pelayanan Pesanan & Surat Jalan'),
          desc: t('order_desc', 'Pencatatan Pesanan Pelanggan, Toko Kelontong, dan Pangkalan Air Mineral'),
        };
      case 'maps-pelanggan':
        return {
          title: t('maps_title', 'Data Peta Toko & Pelanggan'),
          desc: t('maps_desc', 'Radar Sebaran Toko, Status Pesanan Langsung & Navigasi Lokasi Supir'),
        };
      case 'master-data':
        return {
          title: t('master_title', 'Master Data Produk & Armada'),
          desc: t('master_desc', 'Katalog Galon 19L, Botol 600ml, Cup 220ml, dan Armada Motor Roda 3 Viar'),
        };
      case 'armada':
        return {
          title: t('armada_title', 'Manajemen Armada'),
          desc: t('armada_desc', 'Pemantauan Truk Engkel, Pickup Carry, Motor Roda 3 Viar, dan Rute Kirim'),
        };
      case 'sirkulasi-galon':
        return {
          title: t('sirkulasi_title', 'Sirkulasi Wadah & Aset'),
          desc: t('sirkulasi_desc', 'Audit Tabung Galon 19L, Krat Botol Kaca, Tabung Gas LPG, dan Palet Gudang & Truk'),
        };
      case 'kasir':
        return {
          title: t('kasir_title', 'Kasir & Admin Depo'),
          desc: t('kasir_desc', 'Pencatatan Transaksi Tunai, Transfer Bank, QRIS, dan PPN Otomatis'),
        };
      case 'piutang':
        return {
          title: t('piutang_title', 'Buku Piutang & Tempo'),
          desc: t('piutang_desc', 'Buku Piutang Pangkalan / Toko Langganan & Monitoring Batas Kredit Galon'),
        };
      case 'whatsapp':
        return {
          title: t('whatsapp_title', 'Integrasi WhatsApp Order & Tagihan'),
          desc: t('whatsapp_desc', 'Template Notifikasi Tagihan Tempo & Konfirmasi Surat Jalan Otomatis'),
        };
      case 'hr':
        return {
          title: t('hr_title', 'SDM & HR Operasional Depo'),
          desc: t('hr_desc', 'Presensi Staf Depo, Supir & Kernet, serta Skema Komisi Salesman 25% & Kurir 75%'),
        };
      case 'admin-dokumen':
        return {
          title: t('admin_title', 'Executive Manager (Pusat Manajemen)'),
          desc: t('admin_desc', 'Audit Laba Rugi, Susut Aset Tabung, Kinerja Armada & Pengadaan PO Pabrik'),
        };
      case 'super-admin':
        return {
          title: t('super_admin_title', 'Super Admin • Hak Akses Root'),
          desc: t('super_admin_desc', 'Profil Resmi Depo, Rekening Bank/QRIS, Logo Perusahaan & Manajemen Master PIN'),
        };
      case 'driver-mobile':
        return {
          title: t('driver_title', 'Sales & Distribusi'),
          desc: t('driver_desc', 'Navigasi Multi-Drop, Manajemen Toko Binaan, Log Kunjungan & KPI Distribusi'),
        };
      case 'water_fmcg':
        return {
          title: t('water_fmcg_title', 'Distribusi Air & Sembako'),
          desc: t('water_fmcg_desc', 'Depo Air RO & FMCG Dual-Type • Konservasi Tabung Galon & Aging Piutang Tempo'),
        };
      default:
        return {
          title: t('app_management', 'OmniFlow Hub'),
          desc: t('app_desc', 'DISTRIBUTION & FLEET LOGISTICS • by JacS Enterprise'),
        };
    }
  };

  const pageInfo = getPageTitle(activeMenu);
  const featureProfile = getFeatureProfileInfo(activeMenu);

  return (
    <header
      id="jacs-header"
      className="h-13 px-3 sm:px-4 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shrink-0 [body.light-theme_&]:bg-white/95 [body.light-theme_&]:border-slate-200 shadow-sm"
    >
      {/* KIRI: TOGGLE SIDEBAR + LOGO RAIL + JUDUL TUNGGAL PROPORSI / TIDAK BERTUMPUK */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleSidebar && (
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white bg-slate-900/90 border-[1.5px] border-slate-700/80 hover:border-cyan-400 hover:ring-1 hover:ring-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.45)] [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 [body.light-theme_&]:hover:border-cyan-500 [body.light-theme_&]:hover:bg-slate-200 transition-all cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Perluas Sidebar Navigasi' : 'Ciutkan Sidebar ke Rail Mode'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-white" />
            )}
          </button>
        )}

        {/* Brand Logo icon if collapsed */}
        {isSidebarCollapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/25 to-sky-600/30 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.45)]">
              <Droplets className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
        )}

        {/* Judul Tunggal Bersih & Proporsional */}
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-100 [body.light-theme_&]:text-slate-900 tracking-tight truncate">
          {pageInfo.title}
        </h2>
      </div>

      {/* KANAN: JAM WITA, SWITCH TEMA, TOGGLE BAHASA, DAN PROFIL DINAMIS DI SUDUT PALING KANAN */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* 1. Jam Ringkas Digital ("00:48 WITA") */}
        <div
          id="header-clock"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10.5px] font-mono font-semibold text-slate-200 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-800 shadow-xs shrink-0"
          title="Waktu Depo Makassar (WITA)"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400 [body.light-theme_&]:text-cyan-600" />
          <span>{currentTime || '08:00 WITA'}</span>
        </div>

        {/* 2. Toggle Tema (Dark/Light) */}
        <button
          id="btn-toggle-theme"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-amber-400 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-800 transition-all cursor-pointer shrink-0 shadow-xs"
          title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
        </button>

        {/* 3. Toggle Bahasa [ID | EN] */}
        <div
          id="btn-header-language-toggle"
          className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 shadow-xs shrink-0"
          title="Ganti Bahasa / Switch Language"
        >
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              language === 'id'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.45)]'
                : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
            }`}
          >
            <span>🇮🇩</span>
            <span className="font-mono">ID</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              language === 'en'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.45)]'
                : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
            }`}
          >
            <span>🇬🇧</span>
            <span className="font-mono">EN</span>
          </button>
        </div>

        {/* 4. Komponen Profil Dinamis di Sudut Paling Kanan (Horizontal Flex-Row Pill Badge) */}
        <div
          id="header-profile-status"
          className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-cyan-600/50 shadow-xs select-none shrink-0 transition-all"
          title={`Indikator Status: ${featureProfile.name} • Klik avatar untuk unggah foto profil kustom`}
        >
          {/* Avatar Bundar di Sisi KIRI */}
          <div
            className="relative cursor-pointer group/avatar shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {customProfilePhoto ? (
              <img
                src={customProfilePhoto}
                alt={featureProfile.name}
                className="w-8 h-8 rounded-full object-cover border-[1.5px] border-cyan-400/90 shadow-[0_0_10px_rgba(6,182,212,0.35)] ring-1 ring-cyan-500/30"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${featureProfile.gradient} text-white font-black text-[10.5px] font-mono tracking-wider flex items-center justify-center border-[1.5px] border-cyan-400/90 shadow-[0_0_10px_rgba(6,182,212,0.35)] ring-1 ring-cyan-500/30`}
              >
                {featureProfile.initials}
              </div>
            )}

            {/* Hover Camera Overlay for Custom Photo Upload */}
            <div className="absolute inset-0 rounded-full bg-slate-950/65 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-cyan-300">
              <Camera className="w-3.5 h-3.5" />
            </div>

            {/* Reset custom photo button when photo is set and hovered */}
            {customProfilePhoto && (
              <button
                type="button"
                onClick={handleRemoveCustomPhoto}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm opacity-0 group-hover/avatar:opacity-100 transition-opacity z-10 cursor-pointer"
                title="Hapus foto kustom & kembali ke inisial"
              >
                ×
              </button>
            )}
          </div>

          {/* Nama Fitur Aktif & Indikator Sesi Aktif di Sisi KANAN */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] sm:text-[11.5px] font-medium tracking-tight text-slate-200 [body.light-theme_&]:text-slate-800 truncate max-w-[100px] sm:max-w-[145px]">
              {featureProfile.name}
            </span>
          </div>

          {/* Hidden File Input for Custom Profile Photo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>
    </header>
  );
};
