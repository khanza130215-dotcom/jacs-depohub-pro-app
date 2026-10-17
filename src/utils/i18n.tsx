import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export interface Translations {
  [key: string]: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  id: {
    // Brand
    brand_sub: 'DISTRIBUTOR & FLEET MANAGEMENT',

    // Sidebar Menus
    menu_dashboard: 'Beranda',
    menu_order: 'Pelayanan Pesanan',
    menu_order_badge: '1 Baru',
    menu_maps: 'Peta & Lokasi Toko',
    menu_maps_badge: 'Radar Aktif',
    menu_kasir: 'Kasir & Admin',
    menu_piutang: 'Buku Piutang & Tempo',
    menu_piutang_badge: '1 Tempo',
    menu_armada: 'Manajemen Armada',
    menu_armada_badge: '0 Jalan',
    menu_driver_mobile: 'Sales & Distribusi',
    menu_driver_badge: 'NexaField',
    menu_sirkulasi: 'Sirkulasi Wadah & Aset',
    menu_master: 'Master Data Produk',
    menu_whatsapp: 'Integrasi WhatsApp',
    menu_hr: 'SDM & Komisi Supir',
    menu_hr_badge: '12 Staf',
    menu_admin: 'Executive Manager',
    menu_super_admin: 'Super Admin',
    menu_water_fmcg: 'Distribusi Air & Sembako',

    // Menu Categories & Taglines
    cat_operational: 'OPERASIONAL',
    cat_finance: 'KEUANGAN & LOG',
    tagline_water_fmcg: 'Distribusi Air & Sembako',
    tagline_sirkulasi: 'Sirkulasi Wadah & Aset',
    tagline_armada: 'Manajemen Armada',
    tagline_piutang: 'Buku Piutang & Tempo',

    // Header Module Titles & Subtitles
    cockpit_title: 'Pusat Operasional & Distribusi',
    cockpit_desc: 'Pantauan Langsung Stok Galon 19L, Sirkulasi & Penjualan Dus',
    order_title: 'Pelayanan Pesanan & Surat Jalan',
    order_desc: 'Pencatatan Pesanan Pelanggan, Toko Kelontong, dan Pangkalan Air Mineral',
    maps_title: 'Data Peta Toko & Pelanggan',
    maps_desc: 'Radar Sebaran Toko, Status Pesanan Langsung & Navigasi Lokasi Supir',
    master_title: 'Master Data Produk & Armada',
    master_desc: 'Katalog Galon 19L, Botol 600ml, Cup 220ml, dan Armada Motor Roda 3 Viar',
    armada_title: 'Manajemen Armada',
    armada_desc: 'Pemantauan Truk Engkel, Pickup Carry, Motor Roda 3 Viar, dan Rute Kirim',
    sirkulasi_title: 'Sirkulasi Wadah & Aset',
    sirkulasi_desc: 'Audit Tabung Galon 19L, Krat Botol Kaca, Tabung Gas LPG, dan Palet Gudang & Truk',
    kasir_title: 'Kasir & Admin Depo',
    kasir_desc: 'Pencatatan Transaksi Tunai, Transfer Bank, QRIS, dan PPN Otomatis',
    piutang_title: 'Buku Piutang & Tempo',
    piutang_desc: 'Buku Piutang Pangkalan / Toko Langganan & Monitoring Batas Kredit Galon',
    whatsapp_title: 'Integrasi WhatsApp Order & Tagihan',
    whatsapp_desc: 'Template Notifikasi Tagihan Tempo & Konfirmasi Surat Jalan Otomatis',
    hr_title: 'SDM & HR Operasional Depo',
    hr_desc: 'Presensi Staf Depo, Supir & Kernet, serta Skema Komisi Salesman 25% & Kurir 75%',
    admin_title: 'Executive Manager (Pusat Manajemen)',
    admin_desc: 'Identitas Usaha, Kebijakan Harga, Otorisasi Limit Pelanggan & PO Pabrik',
    super_admin_title: 'Super Admin • Hak Akses Root',
    super_admin_desc: 'Profil Resmi Depo, Rekening Bank/QRIS, Logo Perusahaan & Manajemen Master PIN',
    driver_title: 'Sales & Distribusi',
    driver_desc: 'Navigasi Multi-Drop, Manajemen Toko Binaan, Log Kunjungan & KPI Distribusi',
    water_fmcg_title: 'Distribusi Air & Sembako',
    water_fmcg_desc: 'Depo Air Minum RO & FMCG Dual-Type, Konservasi Tabung Galon & Aging Piutang Tempo',
    app_management: 'OmniFlow Hub',
    app_desc: 'DISTRIBUTION & FLEET LOGISTICS • by JacS Enterprise',

    // Header Controls
    mode_driver: 'Mode Supir',
    mode_depo: 'Mode Depo',
    kode_gas: 'Skrip GAS',
    search_placeholder: 'Cari pesanan, galon, toko, nota...',
    theme_light: 'Terang',
    theme_dark: 'Gelap',
    depo_badge: 'Depo #01',
    live_monitoring: 'PEMANTAUAN AKTIF OPERASIONAL',
    lang_toggle_title: 'Ganti ke Bahasa Inggris',
    depo_buka: 'DEPO BUKA',
    depo_hours: '07.00 - 17.00 WITA',
    buffer_aman: 'Cadangan Aman',
    stok_aktual: 'Stok Aktual',
    batas_buffer_min: 'Batas Cadangan Minimum',
    keluar_hari_ini: 'Keluar Hari Ini',

    // EOD / Settlement
    eod_settlement: 'Tutup Buku (17:00 WITA)',
    telemetry_tabung: 'Pantauan Perputaran Tabung',
    telemetry_tabung_sub: 'Status audit kepemilikan dan perputaran tabung galon',
    cockpit_banner_hint: 'Klik salah satu dari 6 kartu metrik di atas untuk menampilkan grafik visual interaktif',

    // Metric Cards
    card_selected: '● TERPILIH',
    card_galon_title: 'Sirkulasi Wadah & Aset',
    card_galon_sub: '820 Terisi · 240 Kosong Siap Antar',
    card_galon_trend: 'Total Aset 1.105',
    card_dus_title: 'Stok Kemasan Dus',
    card_dus_sub: '890 Dus Botol · 530 Dus Cup',
    card_dus_trend: '+8.5% Cadangan Aman',
    card_karyawan_title: 'Aktivitas Karyawan',
    card_karyawan_sub: '1 Supir Jalan · 5 Standby Depo',
    card_karyawan_trend: '1 Armada Bertugas',
    card_omzet_title: 'Omzet Kasir Hari Ini',
    card_omzet_sub: '1 Transaksi Lunas (Kasir Depo)',
    card_omzet_trend: '100% Tunai Kasir Selesai',
    card_bongkar_title: 'Bongkar Muat Barang',
    card_bongkar_sub: '1 Drop Pabrik',
    card_bongkar_trend: 'Drop Terakhir Hari Ini',
    card_pengiriman_title: 'Pengiriman & Antrean',
    card_pengiriman_sub: '1 Antrean Baru · 0 Terkirim',
    card_pengiriman_trend: '15 Galon Dalam Antrean',

    // Nav Aliases
    'nav.cockpit': 'Beranda',
    'nav.order': 'Pelayanan Pesanan',
    'nav.maps': 'Peta & Lokasi Toko',
    'nav.kasir': 'Kasir & Admin',
    'nav.piutang': 'Buku Piutang & Tempo',
    'nav.armada': 'Manajemen Armada',
    'nav.driver': 'Sales & Distribusi',
    'nav.sirkulasi': 'Sirkulasi Wadah & Aset',
    'nav.master': 'Master Data Produk',
    'nav.whatsapp': 'Integrasi WhatsApp',
    'nav.hr': 'SDM & Komisi Supir',
    'nav.admin': 'Executive Manager',
    'nav.super_admin': 'Super Admin',
  },

  en: {
    // Brand
    brand_sub: 'DISTRIBUTOR & FLEET MANAGEMENT',

    // Sidebar Menus
    menu_dashboard: 'Dashboard',
    menu_order: 'Order Fulfillment',
    menu_order_badge: '1 New',
    menu_maps: 'Store Maps & GPS',
    menu_maps_badge: 'Live Radar',
    menu_kasir: 'Cashier & Admin',
    menu_piutang: 'Accounts Receivable',
    menu_piutang_badge: '1 Due',
    menu_armada: 'Fleet Logistics',
    menu_armada_badge: '1 En Route',
    menu_driver_mobile: 'Sales & Distribution',
    menu_driver_badge: 'NexaField',
    menu_sirkulasi: 'Container & Asset Circulation',
    menu_master: 'Master Product Data',
    menu_whatsapp: 'WhatsApp Integration',
    menu_hr: 'HR & Driver Commissions',
    menu_hr_badge: '12 Staff',
    menu_admin: 'Executive Manager',
    menu_super_admin: 'Super Admin',
    menu_water_fmcg: 'Water & FMCG Distribution',

    // Menu Categories & Taglines
    cat_operational: 'OPERATIONS',
    cat_finance: 'FINANCE & AUDIT',
    tagline_water_fmcg: 'Water & FMCG Distribution',
    tagline_sirkulasi: 'Container & Asset Circulation',
    tagline_armada: 'Fleet Logistics',
    tagline_piutang: 'Accounts Receivable',

    // Header Module Titles & Subtitles
    cockpit_title: 'Operations & Distribution Center',
    cockpit_desc: 'Real-time Telemetry for 19L Gallons, Circulation & Case Sales',
    order_title: 'Order Fulfillment & Delivery Notes',
    order_desc: 'Customer Orders, Grocery Stores, and Water Hub Dispatch',
    maps_title: 'Store Maps & Customer Locations',
    maps_desc: 'Store Distribution, Live Order Status & Driver Navigation',
    master_title: 'Product & Fleet Master Data',
    master_desc: 'Catalog of 19L Gallons, 600ml Bottles, 220ml Cups, and Viar Trikes',
    armada_title: 'Fleet Logistics',
    armada_desc: 'Monitoring Canter Trucks, Carry Pickups, Viar Trikes & Delivery Routes',
    sirkulasi_title: 'Container & Asset Circulation',
    sirkulasi_desc: 'Audit of 19L Gallons, Bottle Crates, Gas Cylinders, and Warehouse Pallets',
    kasir_title: 'Cashier & Depot Admin',
    kasir_desc: 'Cash, Bank Transfer, QRIS & Automated VAT Processing',
    piutang_title: 'Accounts Receivable',
    piutang_desc: 'Store Ledger, Credit Limits & Due Date Monitoring',
    whatsapp_title: 'WhatsApp Notification Integration',
    whatsapp_desc: 'Due Payment Templates & Automated Delivery Confirmations',
    hr_title: 'Depot HR & Operations',
    hr_desc: 'Depot Staff Attendance, Drivers & 25% Sales - 75% Courier Split',
    admin_title: 'Executive Manager (Control Center)',
    admin_desc: 'Business Profile, Pricing Policy, Customer Limit Authorization & Factory PO',
    super_admin_title: 'Super Admin • Root Authority',
    super_admin_desc: 'Official Depot Profile, Bank/QRIS Accounts, Brand Logo & Master PIN Management',
    driver_title: 'Sales & Distribution',
    driver_desc: 'Multi-Drop Navigation, Managed Stores, Visit Logs & Distribution KPIs',
    water_fmcg_title: 'Water & FMCG Distribution',
    water_fmcg_desc: 'Dual-Type Water & Groceries Hub, Gallon Physical Conservation & Receivables Aging',
    app_management: 'OmniFlow Hub',
    app_desc: 'DISTRIBUTION & FLEET LOGISTICS • by JacS Enterprise',

    // Header Controls
    mode_driver: 'Driver Mode',
    mode_depo: 'Depo Mode',
    kode_gas: 'GAS Scripts',
    search_placeholder: 'Search orders, gallons, stores, invoices...',
    theme_light: 'Light',
    theme_dark: 'Dark',
    depo_badge: 'Depot #01',
    live_monitoring: 'LIVE OPERATIONS MONITORING',
    lang_toggle_title: 'Switch to Bahasa Indonesia',
    depo_buka: 'DEPOT OPEN',
    depo_hours: '07:00 - 17:00 WITA',
    buffer_aman: 'Safety Buffer',
    stok_aktual: 'Current Stock',
    batas_buffer_min: 'Minimum Safety Buffer',
    keluar_hari_ini: 'Dispatched Today',

    // EOD / Settlement
    eod_settlement: 'EOD Settlement (17:00 WITA)',
    telemetry_tabung: 'Cylinder Asset Telemetry',
    telemetry_tabung_sub: 'Asset ownership audit status and turnover monitoring',
    cockpit_banner_hint: 'Click any of the 6 metric cards above to view interactive SVG charts',

    // Metric Cards
    card_selected: '● SELECTED',
    card_galon_title: 'Container & Asset Circulation',
    card_galon_sub: '820 Filled · 240 Empty Ready',
    card_galon_trend: 'Total Assets 1,105',
    card_dus_title: 'Packaged Case Stock',
    card_dus_sub: '890 Bottle Cases · 530 Cup Cases',
    card_dus_trend: '+8.5% Safety Buffer',
    card_karyawan_title: 'Staff & Fleet Activity',
    card_karyawan_sub: '1 Driver Active · 5 Standby Depot',
    card_karyawan_trend: '1 Active Fleet Duty',
    card_omzet_title: "Today's Cashier Revenue",
    card_omzet_sub: '1 Settled Transaction (Depot Cashier)',
    card_omzet_trend: '100% Direct Cash Settled',
    card_bongkar_title: 'Inbound Factory Unloading',
    card_bongkar_sub: '1 Factory Drop',
    card_bongkar_trend: 'Latest Drop Today',
    card_pengiriman_title: 'Dispatch & Outbound Queue',
    card_pengiriman_sub: '1 New Order · 0 Delivered',
    card_pengiriman_trend: '15 Gallons In Queue',

    // Nav Aliases
    'nav.cockpit': 'Dashboard',
    'nav.order': 'Order Fulfillment',
    'nav.maps': 'Store Maps & GPS',
    'nav.kasir': 'Cashier & Admin',
    'nav.piutang': 'Accounts Receivable',
    'nav.armada': 'Fleet Logistics',
    'nav.driver': 'Sales & Distribution',
    'nav.sirkulasi': 'Container & Asset Circulation',
    'nav.master': 'Master Product Data',
    'nav.whatsapp': 'WhatsApp Integration',
    'nav.hr': 'HR & Driver Commissions',
    'nav.admin': 'Executive Manager',
    'nav.super_admin': 'Super Admin',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('jacs_language');
      if (saved === 'id' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'id'; // Default Bahasa Indonesia
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('jacs_language', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = DICTIONARY[language];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
