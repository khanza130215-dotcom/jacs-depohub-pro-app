import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  CreditCard,
  Image,
  KeyRound,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  MapPin,
  FileText,
  BadgeCheck,
  AlertTriangle,
  AlertOctagon,
  Trash2,
  X,
  LogOut,
} from 'lucide-react';
import {
  DepoBusinessProfile,
  getDepoProfile,
  saveDepoProfile,
  getSuperAdminPin,
  setSuperAdminPin,
} from '../utils/depoProfile';
import { getManagerPin, setManagerPin } from './ManagerPinModal';
import { verifySuperAdminPin, logMasterAdminAction } from '../utils/rootAuthority';
import { resetReceiptCounters } from '../utils/receiptCounter';

interface SuperAdminViewProps {
  onLockSession: () => void;
  onExitToNormalMode?: () => void;
  logoUrl?: string;
  onUpdateLogoUrl?: (newUrl: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  onLockSession,
  onExitToNormalMode,
  logoUrl: propLogoUrl,
  onUpdateLogoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'branding' | 'security'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Profil Usaha
  const [profileForm, setProfileForm] = useState<DepoBusinessProfile>(() => getDepoProfile());

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveDepoProfile(profileForm);
    showToast('✓ Profil Resmi Usaha Depo Berhasil Disimpan!');
  };

  // 2. Pengaturan Rekening Bank & QRIS
  const [bankingForm, setBankingForm] = useState({
    bankName: profileForm.bankName || 'BCA (Bank Central Asia)',
    bankAccount: profileForm.bankAccount || '8090-1234-5678',
    bankHolder: profileForm.bankHolder || 'JacS DepoHub Official',
    qrisUrl: localStorage.getItem('jacs_qris_image_url') || '',
    paymentNotes: localStorage.getItem('jacs_payment_notes') || 'Sertakan nomor invoice / faktur saat transfer bank.',
  });

  const handleSaveBanking = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: DepoBusinessProfile = {
      ...profileForm,
      bankName: bankingForm.bankName,
      bankAccount: bankingForm.bankAccount,
      bankHolder: bankingForm.bankHolder,
    };
    setProfileForm(updatedProfile);
    saveDepoProfile(updatedProfile);
    try {
      localStorage.setItem('jacs_qris_image_url', bankingForm.qrisUrl.trim());
      localStorage.setItem('jacs_payment_notes', bankingForm.paymentNotes.trim());
    } catch {}
    showToast('✓ Rekening Bank Resmi & Instruksi Pembayaran Berhasil Disimpan!');
  };

  // 3. Pengaturan Logo Depo & Logo Developer
  const [depoLogoInput, setDepoLogoInput] = useState(() => {
    return propLogoUrl || localStorage.getItem('jacs_logo_url') || '/logo-jacs.svg';
  });
  const [devLogoInput, setDevLogoInput] = useState(() => {
    return localStorage.getItem('jacs_developer_logo_url') || '/logo-jacs.svg';
  });
  const [imgErrorDepo, setImgErrorDepo] = useState(false);
  const [imgErrorDev, setImgErrorDev] = useState(false);

  const handleSaveLogos = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDepo = depoLogoInput.trim();
    const trimmedDev = devLogoInput.trim();

    if (onUpdateLogoUrl) {
      onUpdateLogoUrl(trimmedDepo);
    } else {
      localStorage.setItem('jacs_logo_url', trimmedDepo);
    }
    localStorage.setItem('jacs_developer_logo_url', trimmedDev);
    showToast('✓ URL Logo Depo & Developer JacS Enterprise Berhasil Disimpan!');
  };

  const handleResetDepoLogo = () => {
    setDepoLogoInput('/logo-jacs.svg');
    setImgErrorDepo(false);
    if (onUpdateLogoUrl) {
      onUpdateLogoUrl('/logo-jacs.svg');
    } else {
      localStorage.setItem('jacs_logo_url', '/logo-jacs.svg');
    }
    showToast('Logo Depo dikembalikan ke SVG bawaan JacS!');
  };

  // 4. Manajemen Keamanan & Ganti PIN
  const [currentManagerPin, setCurrentManagerPin] = useState(() => getManagerPin());
  const [newManagerPin, setNewManagerPin] = useState('');
  const [currentSuperAdminPin, setCurrentSuperAdminPin] = useState(() => getSuperAdminPin());
  const [newSuperAdminPin, setNewSuperAdminPin] = useState('');

  const handleSaveManagerPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newManagerPin.length < 4) {
      showToast('⚠️ PIN Manager minimal 4 digit angka!');
      return;
    }
    setManagerPin(newManagerPin);
    setCurrentManagerPin(newManagerPin);
    setNewManagerPin('');
    showToast('✓ PIN Executive Manager berhasil diubah!');
  };

  const handleSaveSuperAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSuperAdminPin.length < 4) {
      showToast('⚠️ PIN Super Admin minimal 4 digit angka!');
      return;
    }
    setSuperAdminPin(newSuperAdminPin);
    setCurrentSuperAdminPin(newSuperAdminPin);
    setNewSuperAdminPin('');
    showToast('✓ PIN Super Admin (Root) berhasil diubah!');
  };

  // 5. Factory Reset States & Handler
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetStockOption, setResetStockOption] = useState<'preserve_master_zero_stock' | 'zero_all_containers'>('preserve_master_zero_stock');
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetPinError, setResetPinError] = useState<string | null>(null);

  const handleExecuteFactoryReset = () => {
    if (!resetPinInput || !verifySuperAdminPin(resetPinInput)) {
      setResetPinError('PIN Super Admin (Root) salah! Masukkan PIN yang valid.');
      return;
    }
    setResetPinError(null);

    try {
      const keysToClear = [
        'kasir_transactions',
        'argus_kasir_transactions',
        'depo_orders',
        'argus_orders',
        'jacs_orders',
        'piutang_data',
        'argus_receivables',
        'rekap_shift',
        'argus_settlements',
        'argus_inbound_drops',
        'argus_purchase_orders',
        'argus_pos_cart',
        'kasir_cart',
        'jacs_pos_cart',
        'argus_store_submissions',
      ];

      keysToClear.forEach((k) => {
        try {
          localStorage.setItem(k, JSON.stringify([]));
          localStorage.removeItem(k);
        } catch {}
      });

      localStorage.setItem('argus_orders', JSON.stringify([]));
      localStorage.setItem('depo_orders', JSON.stringify([]));
      localStorage.setItem('jacs_orders', JSON.stringify([]));
      localStorage.setItem('argus_kasir_transactions', JSON.stringify([]));
      localStorage.setItem('kasir_transactions', JSON.stringify([]));
      localStorage.setItem('argus_receivables', JSON.stringify([]));
      localStorage.setItem('piutang_data', JSON.stringify([]));
      localStorage.setItem('rekap_shift', JSON.stringify([]));
      localStorage.setItem('kasir_cart', JSON.stringify([]));
      localStorage.setItem('argus_pos_cart', JSON.stringify([]));
      localStorage.setItem('jacs_pos_cart', JSON.stringify([]));
      localStorage.setItem('argus_inbound_drops', JSON.stringify([]));
      localStorage.setItem('argus_purchase_orders', JSON.stringify([]));

      const emptyCirculation = [
        { id: 'AST-G01', category: 'Aqua 19L Original', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 600 },
        { id: 'AST-G02', category: 'Le Minerale 15L/19L', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 350 },
        { id: 'AST-G03', category: 'Vit 19L Danone', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 200 },
        { id: 'AST-G04', category: 'Cleo Smart Gallon 19L', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 150 },
        { id: 'AST-G05', category: 'Air RO Depo Mitra 19L', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 275 },
        { id: 'AST-K01', category: 'Krat Teh Botol Sosro 24 Btl', assetType: 'KRAT_BOTOL', unitName: 'Krat', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 160 },
        { id: 'AST-K02', category: 'Krat Coca-Cola / Fanta / Sprite 24 Btl', assetType: 'KRAT_BOTOL', unitName: 'Krat', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 120 },
        { id: 'AST-L01', category: 'Tabung Gas LPG 3kg Melon Bersubsidi', assetType: 'TABUNG_GAS', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 310 },
        { id: 'AST-L02', category: 'Bright Gas 5.5kg & 12kg Non-Subsidi', assetType: 'TABUNG_GAS', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 80 },
        { id: 'AST-P01', category: 'Palet Plastik HDPE Gudang Depo (120x100)', assetType: 'PALET_KEMASAN', unitName: 'Palet', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 60 },
        { id: 'AST-P02', category: 'Palet Kayu Standard Truk Logistik (120x100)', assetType: 'PALET_KEMASAN', unitName: 'Palet', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 85 },
      ];
      localStorage.setItem('argus_gallon_circulation', JSON.stringify(emptyCirculation));

      try {
        const rawProducts = localStorage.getItem('argus_products');
        if (rawProducts) {
          const parsed = JSON.parse(rawProducts);
          const zeroStockProducts = parsed.map((p: any) => ({ ...p, stock: 0 }));
          localStorage.setItem('argus_products', JSON.stringify(zeroStockProducts));
        }
      } catch {}

      try {
        localStorage.removeItem('argus_dispatch_assignments');
      } catch {}

      const clearedSubmissions = [
        {
          id: 'REG-2026-001',
          name: 'Toko Berkah Mandiri',
          category: 'Toko Mitra',
          ownerName: 'Bpk. H. Ridwan Kamil',
          phone: '0812-9876-5432',
          address: 'Jl. Otto Iskandardinata No. 45, Karanganyar, Subang',
          landmark: 'Sebelah Apotek Kimia Farma, Pagar Hijau',
          coordinates: { lat: -6.5652, lng: 107.7612 },
          mapsUrl: 'https://maps.google.com/?q=-6.5652,107.7612',
          priceTier: 'Toko',
          submittedByDriverName: 'Pak Bambang Sukoco',
          submittedAt: '27 Sep 2026 10.15 WITA',
          status: 'DISETUJUI',
          notes: 'Terverifikasi & disetujui untuk operasional depo Makassar.',
        },
      ];
      localStorage.setItem('argus_store_submissions', JSON.stringify(clearedSubmissions));
      localStorage.setItem('jacshub_mock_version', `factory_clean_${Date.now()}`);

      resetReceiptCounters();

      if (typeof window !== 'undefined') {
        const resetEvent = new CustomEvent('depo_data_reset', {
          detail: {
            preserveMasterSku: resetStockOption === 'preserve_master_zero_stock',
          },
        });
        window.dispatchEvent(resetEvent);
        window.dispatchEvent(new Event('storage'));
      }

      setIsResetModalOpen(false);
      setResetPinInput('');
      setResetStep(1);

      const successMsg = 'Sistem berhasil dikosongkan total. Siap untuk input operasional riil.';
      showToast('✅ ' + successMsg);
      logMasterAdminAction('FACTORY_RESET', 'Factory Reset penuh dieksekusi dari Super Admin View.', 'critical');

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('depo_data_reset', {
            detail: {
              preserveMasterSku: resetStockOption === 'preserve_master_zero_stock',
            },
          }));
        }
      }, 250);
    } catch (err: any) {
      showToast('⚠️ Gagal membersihkan data: ' + err?.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-rose-500 text-white font-bold text-xs shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar Super Admin */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-xl border border-rose-900/60 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-300 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-[0_0_16px_rgba(225,29,72,0.45)] border border-rose-400/50">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                Super Admin Configuration Center
              </h2>
              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                LEVEL ROOT
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
              Pusat Konfigurasi Identitas Depo, Rekening Bank, URL Logo & Manajemen Otorisasi PIN
            </p>
          </div>
        </div>

        {/* Action Lock Super Admin */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>SESI ROOT AKTIF</span>
          </div>

          {onExitToNormalMode && (
            <button
              type="button"
              onClick={onExitToNormalMode}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-emerald-400/50"
              title="Keluar dari sesi Super Admin / Developer ROOT dan kembali ke Mode Kasir / Staf Operasional Normal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>🚪 KELUAR KE MODE NORMAL / KASIR</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLockSession}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Kunci sesi Super Admin dan amankan seluruh konfigurasi inti"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Sesi Super Admin</span>
          </button>
        </div>
      </div>

      {/* 4 Tabs Super Admin */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-300 rounded-xl shrink-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>1. Identitas Usaha</span>
        </button>

        <button
          onClick={() => setActiveTab('banking')}
          className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'banking'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>2. Rekening & Pembayaran</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'branding'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>3. Logo Depo & Developer</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>4. Keamanan PIN Otorisasi</span>
        </button>
      </div>

      {/* Main Tab Content Body */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
        
        {/* ========================================================
            TAB 1: IDENTITAS & PROFIL USAHA DEPO
            ======================================================== */}
        {activeTab === 'profile' && (
          <div className="glass-panel p-4 sm:p-5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span>Formulir Legalitas & Identitas Resmi Usaha Depo</span>
              </h3>
              <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                Data ini menjadi referensi kop resmi otomatis pada cetak faktur, struk kasir thermal, surat jalan armada pengiriman, dan pesan tagihan WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Nama Usaha Depo Air Mineral:
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Contoh: JacS DepoHub Subang"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Nomor WhatsApp / Hotline Resmi Depo:
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="0812-9988-7711"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Alamat Lengkap Gudang & Kantor Operasional:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Jl. Raya Subang - Bandung KM 4.5, Sukamaju, Subang, Jawa Barat 41285"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Nomor Induk Berusaha (NIB):
                  </label>
                  <input
                    type="text"
                    value={profileForm.nib}
                    onChange={(e) => setProfileForm({ ...profileForm, nib: e.target.value })}
                    placeholder="9120003482194"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    NPWP Badan Usaha:
                  </label>
                  <input
                    type="text"
                    value={profileForm.npwp}
                    onChange={(e) => setProfileForm({ ...profileForm, npwp: e.target.value })}
                    placeholder="01.892.482.3-409.000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Identitas Profil Usaha</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 2: PENGATURAN REKENING & PEMBAYARAN
            ======================================================== */}
        {activeTab === 'banking' && (
          <div className="glass-panel p-4 sm:p-5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-400" />
                <span>Pengaturan Rekening Bank Penerima & Instruksi QRIS</span>
              </h3>
              <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                Rekening resmi ini otomatis tercetak pada nota thermal POS kasir dan pesan WhatsApp tagihan tempo untuk pelanggan toko.
              </p>
            </div>

            <form onSubmit={handleSaveBanking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Nama Bank / Dompet Digital:
                  </label>
                  <input
                    type="text"
                    required
                    value={bankingForm.bankName}
                    onChange={(e) => setBankingForm({ ...bankingForm, bankName: e.target.value })}
                    placeholder="BCA / Mandiri / BRI / BNI"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Nomor Rekening Bank:
                  </label>
                  <input
                    type="text"
                    required
                    value={bankingForm.bankAccount}
                    onChange={(e) => setBankingForm({ ...bankingForm, bankAccount: e.target.value })}
                    placeholder="8090-1234-5678"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-sm [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    Atas Nama Rekening (Pemilik):
                  </label>
                  <input
                    type="text"
                    required
                    value={bankingForm.bankHolder}
                    onChange={(e) => setBankingForm({ ...bankingForm, bankHolder: e.target.value })}
                    placeholder="JacS DepoHub Official"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                  Catatan / Instruksi Pembayaran Transfer:
                </label>
                <input
                  type="text"
                  value={bankingForm.paymentNotes}
                  onChange={(e) => setBankingForm({ ...bankingForm, paymentNotes: e.target.value })}
                  placeholder="Contoh: Sertakan nomor invoice / faktur saat transfer bank."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                />
              </div>

              {/* Preview Kartu Rekening */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider font-bold">
                    Tampilan pada Faktur / Struk
                  </span>
                  <div className="text-sm font-black text-white">
                    {bankingForm.bankName} - {bankingForm.bankAccount}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    a/n {bankingForm.bankHolder}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Rekening</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: PENGATURAN LOGO DEPO & DEVELOPER
            ======================================================== */}
        {activeTab === 'branding' && (
          <div className="glass-panel p-4 sm:p-5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                <Image className="w-4 h-4 text-rose-400" />
                <span>Pengaturan URL Logo Usaha Depo & Identitas Pengembang JacS</span>
              </h3>
              <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
                Konfigurasi tautan URL gambar logo (Google Drive, Cloudinary, Imgur, atau link hosting gambar publik lainnya).
              </p>
            </div>

            <form onSubmit={handleSaveLogos} className="space-y-4 text-xs">
              {/* 1. Logo Depo */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                  {depoLogoInput && !imgErrorDepo ? (
                    <img
                      src={depoLogoInput}
                      alt="Logo Depo"
                      onError={() => setImgErrorDepo(true)}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-cyan-500 to-sky-700 flex items-center justify-center font-mono font-black text-xs text-white">
                      JacS
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                      URL Logo Utama Depo (Sidebar Header & Dokumen Cetak):
                    </label>
                    <button
                      type="button"
                      onClick={handleResetDepoLogo}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset ke Bawaan</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={depoLogoInput}
                    onChange={(e) => {
                      setDepoLogoInput(e.target.value);
                      setImgErrorDepo(false);
                    }}
                    placeholder="https://... atau /logo-jacs.svg"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">
                    Kosongkan kolom ini jika ingin memakai lencana visual inisial badge <strong>JacS</strong> elegan bawaan sistem.
                  </p>
                </div>
              </div>

              {/* 2. Logo Developer */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                  {devLogoInput && !imgErrorDev ? (
                    <img
                      src={devLogoInput}
                      alt="Logo Dev"
                      onError={() => setImgErrorDev(true)}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-mono font-black text-xs text-white">
                      Dev
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                  <label className="text-xs font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    URL Logo Pengembang (JacS Enterprise):
                  </label>
                  <input
                    type="text"
                    value={devLogoInput}
                    onChange={(e) => {
                      setDevLogoInput(e.target.value);
                      setImgErrorDev(false);
                    }}
                    placeholder="/logo-jacs.svg atau link https://..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">
                    Ditampilkan pada Footer Sidebar & kartu hak cipta "Developed by JacS Enterprise v2.0 Pro Edition".
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Logo</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 4: MANAJEMEN KEAMANAN & GANTI PIN
            ======================================================== */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Ganti PIN Executive Manager */}
            <div className="glass-panel p-4 sm:p-5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase">
                    PIN Executive Manager
                  </h4>
                  <p className="text-[10px] text-slate-400">Proteksi Modul Audit Eksekutif</p>
                </div>
              </div>

              <form onSubmit={handleSaveManagerPin} className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center font-mono">
                  <span className="text-slate-400">PIN Saat Ini:</span>
                  <strong className="text-cyan-400 tracking-widest">{currentManagerPin}</strong>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    PIN Baru Executive Manager (Min 4 Digit):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newManagerPin}
                    onChange={(e) => setNewManagerPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ketik PIN Baru..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-sm focus:border-rose-500 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={newManagerPin.length < 4}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Perbarui PIN Manager</span>
                </button>
              </form>
            </div>

            {/* Box 2: Ganti PIN Super Admin */}
            <div className="glass-panel p-4 sm:p-5 rounded-xl border border-rose-900/60 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-300 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-rose-900/40">
                <div className="w-8 h-8 rounded-lg bg-rose-600/25 text-rose-400 border border-rose-500/50 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase">
                    PIN Super Admin (Root)
                  </h4>
                  <p className="text-[10px] text-slate-400">Otorisasi Tertinggi Sistem</p>
                </div>
              </div>

              <form onSubmit={handleSaveSuperAdminPin} className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center font-mono">
                  <span className="text-slate-400">PIN Root Saat Ini:</span>
                  <strong className="text-rose-400 tracking-widest">{currentSuperAdminPin}</strong>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                    PIN Baru Super Admin (Min 4 Digit):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newSuperAdminPin}
                    onChange={(e) => setNewSuperAdminPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ketik PIN Baru..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-sm focus:border-rose-500 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={newSuperAdminPin.length < 4}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Perbarui PIN Super Admin</span>
                </button>
              </form>
            </div>

            {/* Box 3: DANGER ZONE - FACTORY RESET / KOSONGKAN SEMUA DATA OPERASIONAL */}
            <div className="glass-panel p-4 sm:p-5 rounded-xl border-2 border-red-600/80 [body.light-theme_&]:bg-white [body.light-theme_&]:border-red-400 space-y-3 shadow-lg shadow-rose-950/40">
              <div className="flex items-center gap-2.5 pb-2 border-b border-red-900/40">
                <div className="w-8 h-8 rounded-lg bg-red-600/25 text-red-400 border border-red-500/50 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase">
                      Zona Berbahaya (Danger Zone Root)
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-rose-600 text-white">
                      IRREVERSIBLE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Kosongkan data simulasi &amp; reset operasional ke titik nol riil</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 [body.light-theme_&]:text-slate-600 leading-relaxed">
                Menghapus seluruh transaksi kasir, mengosongkan antrean pengiriman &amp; menyetel armada ke status standby, mereset saldo piutang ke Rp 0, menolkan stok fisik wadah, serta mereset log kehadiran karyawan.
              </p>

              <button
                type="button"
                onClick={() => {
                  setResetStep(1);
                  setResetPinInput('');
                  setResetPinError(null);
                  setIsResetModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 via-rose-600 to-amber-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-rose-400 animate-pulse hover:animate-none tracking-wide active:scale-95"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>⚠️ FACTORY RESET - KOSONGKAN SEMUA DATA OPERASIONAL &amp; DUMMY</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Double Confirmation Factory Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            <div className="p-4 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-b border-rose-600/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-400 border border-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                  <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                      ROOT AUTHORIZATION
                    </span>
                    <span className="text-[10px] text-rose-300 font-bold">
                      {resetStep === 1 ? 'Langkah 1/2: Konfirmasi Aksi' : 'Langkah 2/2: Verifikasi PIN ROOT'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                    Factory Reset &amp; Kosongkan Data Operasional
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetStep(1);
                  setResetPinInput('');
                  setResetPinError(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {resetStep === 1 ? (
                <>
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 leading-relaxed flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        PERINGATAN: Anda akan melakukan FACTORY RESET sistem secara total!
                      </p>
                      <p className="text-[11px] text-rose-200/90 mt-1">
                        Seluruh transaksi kasir, antrean pengiriman, piutang tempo, dan log absensi akan dibersihkan ke titik nol riil.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                      Pilihan Penanganan Stok Fisik &amp; Master SKU:
                    </span>
                    <div className="space-y-2">
                      <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        resetStockOption === 'preserve_master_zero_stock'
                          ? 'bg-rose-950/30 border-rose-500 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="saResetStockOption"
                          value="preserve_master_zero_stock"
                          checked={resetStockOption === 'preserve_master_zero_stock'}
                          onChange={() => setResetStockOption('preserve_master_zero_stock')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <strong className="text-xs block text-slate-200">
                            Pertahankan Master SKU dengan Stok 0 (Direkomendasikan)
                          </strong>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Katalog master produk tetap tersimpan di database, tetapi seluruh stok fisik digudangkan ke 0 unit.
                          </p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        resetStockOption === 'zero_all_containers'
                          ? 'bg-rose-950/30 border-rose-500 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="saResetStockOption"
                          value="zero_all_containers"
                          checked={resetStockOption === 'zero_all_containers'}
                          onChange={() => setResetStockOption('zero_all_containers')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <strong className="text-xs block text-slate-200">
                            Kosongkan Seluruh Stok &amp; Riwayat Sirkulasi Wadah Total
                          </strong>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Nolkan seluruh stok galon terisi, dus, tabung gas, krat, dan tabung dipinjamkan pangkalan/warga.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 leading-relaxed flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        Otorisasi Keamanan Tingkat ROOT Diperlukan
                      </p>
                      <p className="text-[11px] text-amber-200/90 mt-1">
                        Masukkan PIN Super Admin (Root) untuk mengeksekusi pengosongan sistem total.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-200 block text-center">
                      Masukkan PIN Super Admin (Root):
                    </label>
                    <input
                      type="password"
                      autoFocus
                      maxLength={6}
                      value={resetPinInput}
                      onChange={(e) => {
                        setResetPinInput(e.target.value.replace(/\D/g, ''));
                        setResetPinError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && resetPinInput.length >= 4) {
                          handleExecuteFactoryReset();
                        }
                      }}
                      placeholder="••••"
                      className="w-full max-w-[200px] mx-auto block px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-rose-500 text-white font-mono text-center tracking-[0.5em] text-lg focus:outline-hidden focus:border-red-400"
                    />

                    {resetPinError && (
                      <p className="text-xs text-rose-400 text-center font-bold">
                        {resetPinError}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 text-center">
                      PIN default instalasi awal adalah <strong>9999</strong> jika belum diubah.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (resetStep === 2) {
                    setResetStep(1);
                    setResetPinError(null);
                  } else {
                    setIsResetModalOpen(false);
                    setResetPinInput('');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-slate-700"
              >
                {resetStep === 2 ? '← Kembali' : 'Batal'}
              </button>

              {resetStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setResetStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-900/50 flex items-center gap-2 active:scale-95 transition-all border border-rose-400/40"
                >
                  <span>Lanjut ke Verifikasi PIN ROOT →</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={resetPinInput.length < 4}
                  onClick={handleExecuteFactoryReset}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-900/50 flex items-center gap-2 active:scale-95 transition-all border border-rose-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>⚠️ Eksekusi Factory Reset Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
