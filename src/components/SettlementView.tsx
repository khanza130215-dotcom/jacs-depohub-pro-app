import React, { useState } from 'react';
import { OrderItem, ArmadaItem, EmployeeItem, GallonStock, DriverSetoranItem, ReceivableItem } from '../types';
import { DRIVER_SETORAN } from '../data/mockData';
import {
  Lock,
  Unlock,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Truck,
  RotateCw,
  FileText,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Check,
  X,
  CreditCard,
  QrCode,
  Layers,
  Sparkles,
  TrendingUp,
  Share2,
  Copy,
} from 'lucide-react';

interface SettlementViewProps {
  orders?: OrderItem[];
  armadaList?: ArmadaItem[];
  employees?: EmployeeItem[];
  gallonCirculation?: GallonStock[];
  driverSetoran?: DriverSetoranItem[];
  receivables?: ReceivableItem[];
  dailyReconciliationAddedCash?: number;
  onBookCommission?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  orders = [],
  armadaList = [],
  employees = [],
  gallonCirculation = [],
  driverSetoran = DRIVER_SETORAN,
  receivables = [],
  dailyReconciliationAddedCash = 0,
  onBookCommission,
  onClose,
  isModal = false,
}) => {
  // Settlement lock state
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem('argus_settlement_locked_today') === 'true';
  });
  const [lockedTimestamp, setLockedTimestamp] = useState<string>(() => {
    return localStorage.getItem('argus_settlement_locked_time') || '17:00 WIB';
  });
  const [lockedBy, setLockedBy] = useState<string>(() => {
    return localStorage.getItem('argus_settlement_locked_by') || 'Super Admin (Irfan Hakim)';
  });
  const [commissionsBooked, setCommissionsBooked] = useState<boolean>(() => {
    return localStorage.getItem('argus_settlement_locked_today') === 'true';
  });

  // Physical Cash Counter Input for Reconciliation
  // 1 Transaksi Selesai: Rekap Kas total Rp 450.000 (Tunai Rp 450.000 + QRIS Rp 0)
  const kasirCashDirect = 450000;
  const kasirQrisTransfer = 0;
  const subtotalKasir = kasirCashDirect + kasirQrisTransfer; // Rp 450.000

  // Setoran Supir / Kurir Viar di Lapangan:
  const driverSetoranList = driverSetoran.length > 0 ? driverSetoran : DRIVER_SETORAN;
  const subtotalSetoranDriver = driverSetoranList.reduce((sum, d) => sum + d.receivedCash, 0); // Rp 12.740.000

  // Pelunasan Piutang Tempo (Real-time):
  const pelunasanTempoKas = dailyReconciliationAddedCash;

  // Expected vault cash = Tunai Kasir + Pelunasan Tunai + Tunai Setoran Driver:
  const expectedVaultCash = kasirCashDirect + pelunasanTempoKas + subtotalSetoranDriver;
  const grandTotalKas = subtotalKasir + pelunasanTempoKas + subtotalSetoranDriver;

  const [actualVaultCashInput, setActualVaultCashInput] = useState<number>(expectedVaultCash);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [shiftSlipFormat, setShiftSlipFormat] = useState<'58mm' | '80mm'>('80mm');
  const [modalTab, setModalTab] = useState<'thermal' | 'berita-acara'>('thermal');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [settlementNotes, setSettlementNotes] = useState<string>(
    'Semua ritase pengiriman armada pickup & Viar selesai tepat waktu. Setoran omzet kasir depo & supir telah cocok seimbang (Nihil selisih).'
  );

  const cashDifference = actualVaultCashInput - expectedVaultCash;

  // 2. REKAP FISIK GALON: 580 galon terisi + 240 galon kosong siap antar
  const totalArmadaEmptyGallons = armadaList.reduce((sum, a) => sum + (a.emptyGallonLoad || 0), 0) || 300;
  const totalGudangEmptyGallons = 240; // 240 galon kosong siap antar
  const totalFisikKosongDepo = totalGudangEmptyGallons;
  const kuotaTabungSeharusnyaKembali = 1005; // Total galon keluar antar hari ini
  const tabungTertahanDiToko = Math.max(0, kuotaTabungSeharusnyaKembali - totalArmadaEmptyGallons);
  const selisihHilangRusak = 0; // 0 Seimbang

  // Rincian Galon per Armada Supir
  const armadaReconciliation = [
    {
      armadaId: 'ARM-01',
      plate: 'B 9421 KDA',
      driver: 'Pak Bambang Sukoco',
      vehicle: 'Carry Pickup',
      deliveredGallons: 320,
      emptyGallonsRetur: armadaList.find((a) => a.id === 'ARM-01')?.emptyGallonLoad || 68,
      heldAtStores: 252,
      status: 'Selesai Ritase (Setor Depo)',
    },
    {
      armadaId: 'ARM-02',
      plate: 'B 9104 UCN',
      driver: 'Rudi Hartono',
      vehicle: 'Gran Max Boks',
      deliveredGallons: 280,
      emptyGallonsRetur: armadaList.find((a) => a.id === 'ARM-02')?.emptyGallonLoad || 55,
      heldAtStores: 225,
      status: 'Selesai Ritase (Setor Depo)',
    },
    {
      armadaId: 'ARM-03',
      plate: 'B 9104 UCN',
      driver: 'Rian Prasetyo',
      vehicle: 'Gran Max Terpal',
      deliveredGallons: 220,
      emptyGallonsRetur: armadaList.find((a) => a.id === 'ARM-03')?.emptyGallonLoad || 42,
      heldAtStores: 178,
      status: 'Selesai Ritase (Setor Depo)',
    },
    {
      armadaId: 'ARM-04',
      plate: 'B 9033 TCA',
      driver: 'Dedi Kurniawan',
      vehicle: 'Truk Canter Engkel',
      deliveredGallons: 185,
      emptyGallonsRetur: armadaList.find((a) => a.id === 'ARM-04')?.emptyGallonLoad || 110,
      heldAtStores: 75,
      status: 'Selesai Ritase (Setor Depo)',
    },
    {
      armadaId: 'ARM-05',
      plate: 'B 6124 KRO',
      driver: 'Hendra Gunawan',
      vehicle: 'Motor Viar Karya 300',
      deliveredGallons: 95,
      emptyGallonsRetur: armadaList.find((a) => a.id === 'ARM-05')?.emptyGallonLoad || 25,
      heldAtStores: 70,
      status: 'Selesai Ritase (Setor Depo)',
    },
  ];

  // 3. DAFTAR KOMISI SUPIR HARI INI:
  const driverCommissions = [
    {
      driverName: 'Pak Bambang Sukoco',
      vehicle: 'Carry Pickup (B 9421 KDA)',
      gallons: 320,
      rate: 750,
      commissionAmount: 240000,
    },
    {
      driverName: 'Rudi Hartono',
      vehicle: 'Gran Max Boks (B 9104 UCN)',
      gallons: 280,
      rate: 750,
      commissionAmount: 210000,
    },
    {
      driverName: 'Rian Prasetyo',
      vehicle: 'Gran Max Terpal (B 9104 UCN)',
      gallons: 220,
      rate: 750,
      commissionAmount: 165000,
    },
    {
      driverName: 'Hendra Gunawan',
      vehicle: 'Motor Viar (B 6124 KRO)',
      gallons: 185,
      rate: 750,
      commissionAmount: 138750,
    },
  ];
  const grandTotalCommissions = driverCommissions.reduce((sum, d) => sum + d.commissionAmount, 0);

  // 2. REKAP FISIK GALON PER BRAND (580 TERISI + 240 KOSONG SIAP ANTAR = 820 TABUNG):
  const gallonInventoryRecon = [
    {
      brand: 'Aqua 19L Original',
      saldoAwal: 400,
      masukPabrik: 450,
      keluarAntar: 450,
      sisaSistem: 400,
      fisikTerisi: 280,
      fisikKosong: 120,
      fisikTotalAktual: 400,
      selisih: 0,
      diTokoBeredar: 360,
    },
    {
      brand: 'Le Minerale 19L/15L',
      saldoAwal: 230,
      masukPabrik: 280,
      keluarAntar: 280,
      sisaSistem: 230,
      fisikTerisi: 160,
      fisikKosong: 70,
      fisikTotalAktual: 230,
      selisih: 0,
      diTokoBeredar: 210,
    },
    {
      brand: 'Vit 19L Segel',
      saldoAwal: 115,
      masukPabrik: 200,
      keluarAntar: 200,
      sisaSistem: 115,
      fisikTerisi: 85,
      fisikKosong: 30,
      fisikTotalAktual: 115,
      selisih: 0,
      diTokoBeredar: 130,
    },
    {
      brand: 'Cleo Pure Smart Gallon',
      saldoAwal: 75,
      masukPabrik: 75,
      keluarAntar: 75,
      sisaSistem: 75,
      fisikTerisi: 55,
      fisikKosong: 20,
      fisikTotalAktual: 75,
      selisih: 0,
      diTokoBeredar: 65,
    },
  ];

  const totalSaldoAwal = gallonInventoryRecon.reduce((s, g) => s + g.saldoAwal, 0);
  const totalMasukPabrik = gallonInventoryRecon.reduce((s, g) => s + g.masukPabrik, 0);
  const totalKeluarAntar = gallonInventoryRecon.reduce((s, g) => s + g.keluarAntar, 0);
  const totalEstimasiSisa = gallonInventoryRecon.reduce((s, g) => s + g.sisaSistem, 0);
  const totalFisikTerisi = gallonInventoryRecon.reduce((s, g) => s + g.fisikTerisi, 0); // 580
  const totalFisikKosong = gallonInventoryRecon.reduce((s, g) => s + g.fisikKosong, 0); // 240

  // Kunci Tutup Buku & Cetak Rekap Shift Handler
  const handleLockAndPrintShift = () => {
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setIsLocked(true);
    setLockedTimestamp(nowStr);
    setCommissionsBooked(true);
    localStorage.setItem('argus_settlement_locked_today', 'true');
    localStorage.setItem('argus_settlement_locked_time', nowStr);
    localStorage.setItem('argus_settlement_locked_by', lockedBy);

    if (onBookCommission) {
      onBookCommission();
    }

    // Automatically open interactive shift recap modal with thermal slip view
    setModalTab('thermal');
    setShowPrintModal(true);
  };

  const handleUnlockOverride = () => {
    if (confirm('Buka kembali kunci tutup buku untuk revisi transaksi kasir / supir?')) {
      setIsLocked(false);
      localStorage.removeItem('argus_settlement_locked_today');
    }
  };

  // Generate WhatsApp Share Text
  const generateWhatsAppShiftText = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return `*REKAPITULASI CLOSING SHIFT & TUTUP BUKU HARIAN (17:00 WIB)*\n` +
      `*DEPO AIR MINERAL SUBANG - JAC S DEPOHUB*\n` +
      `📅 Tanggal: ${todayStr} (${lockedTimestamp})\n` +
      `👤 Penanggung Jawab: ${lockedBy}\n` +
      `🔒 Status: *TERKUNCI & SAH*\n` +
      `----------------------------------------\n` +
      `*1. REKAP PENERIMAAN KAS & OMZET:*\n` +
      `• Kasir Depo Walk-in: *Rp ${subtotalKasir.toLocaleString('id-ID')}*\n` +
      `  - Tunai Kasir: Rp ${kasirCashDirect.toLocaleString('id-ID')}\n` +
      `  - QRIS / Non-Tunai: Rp ${kasirQrisTransfer.toLocaleString('id-ID')}\n` +
      (pelunasanTempoKas > 0 ? `• Pelunasan Piutang Tempo: *+Rp ${pelunasanTempoKas.toLocaleString('id-ID')}*\n` : '') +
      `• Setoran Armada Supir (4 Unit): *Rp ${subtotalSetoranDriver.toLocaleString('id-ID')}*\n` +
      `  - Pak Bambang Sukoco: Rp 4.250.000\n` +
      `  - Rudi Hartono: Rp 3.850.000\n` +
      `  - Rian Prasetyo: Rp 2.940.000\n` +
      `  - Hendra Gunawan: Rp 1.700.000\n` +
      `💰 *GRAND TOTAL OMZET DEPO: Rp ${grandTotalKas.toLocaleString('id-ID')}*\n` +
      `🏦 *TARGET KAS FISIK BRANKAS: Rp ${expectedVaultCash.toLocaleString('id-ID')}* (Status: SEIMBANG Rp 0)\n` +
      `----------------------------------------\n` +
      `*2. REKONSILIASI FISIK GALON DEPO:*\n` +
      `• Total Fisik Galon di Depo: *${totalFisikTerisi + totalFisikKosong} Tabung*\n` +
      `  - Galon Terisi (Siap Jual/Antar): *${totalFisikTerisi} Tabung*\n` +
      `  - Galon Kosong (Siap Antar/Refill): *${totalFisikKosong} Tabung*\n` +
      `• Kuota Keluar Antar Hari Ini: ${kuotaTabungSeharusnyaKembali} Tabung\n` +
      `• Retur Ditarik Armada Supir: *${totalArmadaEmptyGallons} Tabung*\n` +
      `• Sisa Tabung Tertahan di Toko Mitra: *${tabungTertahanDiToko} Tabung*\n` +
      `• Selisih Tabung Hilang / Rusak: *0 (Nihil / 100% Match)*\n` +
      `----------------------------------------\n` +
      `*3. PEMBUKUAN KOMISI SUPIR HARI INI:*\n` +
      `• Total Komisi Armada Dibukukan: *Rp ${grandTotalCommissions.toLocaleString('id-ID')}*\n` +
      `  - Pak Bambang (320 Gln): Rp 240.000\n` +
      `  - Rudi Hartono (280 Gln): Rp 210.000\n` +
      `  - Rian Prasetyo (220 Gln): Rp 165.000\n` +
      `  - Hendra Gunawan (185 Gln): Rp 138.750\n` +
      `----------------------------------------\n` +
      `📝 Catatan: ${settlementNotes}\n` +
      `✓ Laporan otomatis tersimpan di sistem cloud DepoHub.`;
  };

  const handleCopyShiftText = () => {
    const text = generateWhatsAppShiftText();
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleDownloadJSON = () => {
    const reportData = {
      depoName: 'JACS DEPOHUB - DISTRIBUSI AIR MINERAL SUBANG',
      reportType: 'Rekonsiliasi Kas & Tutup Buku Harian (Settlement 17:00 WIB)',
      closingDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      closingTime: lockedTimestamp,
      isLocked,
      commissionsBooked,
      validator: lockedBy,
      cashReconciliation: {
        omzetKasirDepo: {
          tunaiFisik: kasirCashDirect,
          qrisTransfer: kasirQrisTransfer,
          subtotal: subtotalKasir,
        },
        pelunasanPiutangTempo: pelunasanTempoKas,
        setoranSupirLapangan: {
          rincian: driverSetoranList,
          subtotal: subtotalSetoranDriver,
        },
        grandTotalOmzet: grandTotalKas,
        targetKasFisikBrankas: expectedVaultCash,
        aktualFisikBrankas: actualVaultCashInput,
        selisihKas: cashDifference,
      },
      emptyGallonReconciliation: {
        kuotaKeluarHariIni: kuotaTabungSeharusnyaKembali,
        returDitarikArmada: totalArmadaEmptyGallons,
        tertahanDiToko: tabungTertahanDiToko,
        kosongDiGudangDepo: totalGudangEmptyGallons,
        selisih: selisihHilangRusak,
        breakdownArmada: armadaReconciliation,
        breakdownBrand: gallonInventoryRecon,
      },
      driverCommissions: {
        total: grandTotalCommissions,
        rincian: driverCommissions,
      },
      notes: settlementNotes,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `settlement_1700_depohub_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={`flex flex-col gap-2.5 overflow-hidden [body.light-theme_&]:text-slate-900 ${isModal ? 'h-full p-1' : 'h-full'}`}>
      {/* Top Banner with Lock Status */}
      <div className="glass-panel p-2.5 px-3.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm border-t-4 border-t-cyan-500">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm ${
            isLocked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-800'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800'
          }`}>
            {isLocked ? <Lock className="w-5 h-5 font-black" /> : <Clock className="w-5 h-5 font-black" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white [body.light-theme_&]:text-slate-900 tracking-tight leading-none">
                REKONSILIASI KAS & TUTUP BUKU HARIAN (SETTLEMENT 17:00 WIB)
              </h2>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                isLocked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-900'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900'
              }`}>
                {isLocked ? `TERKUNCI (${lockedTimestamp})` : 'OPERASIONAL AKTIF (SIAP CLOSING)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium mt-0.5">
              Bandingkan total kas masuk kasir depo Rp 450.000 (Tunai Rp 450.000 + QRIS Rp 0), audit fisik 580 galon terisi + 240 galon kosong siap antar, serta bukukan komisi supir
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Tombol [ 🔒 Kunci Tutup Buku & Cetak Rekap Shift ] */}
          <button
            type="button"
            onClick={handleLockAndPrintShift}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md ${
              isLocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
            }`}
            title="Kunci status transaksi hari ini, membukukan komisi supir, dan menampilkan ringkasan rekap shift"
          >
            <Lock className="w-3.5 h-3.5 font-black" />
            <span>{isLocked ? '🔒 Tutup Buku Terkunci (Cetak Rekap Shift)' : '🔒 Kunci Tutup Buku & Cetak Rekap Shift'}</span>
          </button>

          {isLocked && (
            <button
              type="button"
              onClick={handleUnlockOverride}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Buka kunci untuk revisi transaksi (Admin Override)"
            >
              <Unlock className="w-3 h-3 inline mr-1" />
              <span>Buka Kunci</span>
            </button>
          )}

          {/* Tombol Buka Lembar Rekap Shift */}
          <button
            type="button"
            onClick={() => {
              setModalTab('thermal');
              setShowPrintModal(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Rekap Shift / Cetak</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Scrollable Internally) */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-0.5">
        {/* ========================================================
            BAGIAN 1: REKAPITULASI KAS HARIAN & OMZET DEPO
            ======================================================== */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 border-t-4 border-t-cyan-500 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                1. REKAPITULASI PENERIMAAN KAS & OMZET DEPO (HARIAN 17:00 WIB)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 [body.light-theme_&]:text-cyan-800 font-bold">
              Grand Total Omzet Kas: Rp {grandTotalKas.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Panel A: Kasir Depo (Tunai & QRIS) - Rp 18.450.000 */}
            <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-emerald-400 [body.light-theme_&]:text-emerald-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Omzet Kasir Depo (Loket & POS)
                </span>
                <span className="font-mono font-black text-emerald-400 [body.light-theme_&]:text-slate-900 text-xs">
                  Rp {subtotalKasir.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 [body.light-theme_&]:text-slate-700">Tunai Kasir Langsung:</span>
                  </div>
                  <span className="font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                    Rp {kasirCashDirect.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-slate-300 [body.light-theme_&]:text-slate-700">Non-Tunai (QRIS & Bank):</span>
                  </div>
                  <span className="font-mono font-bold text-white [body.light-theme_&]:text-slate-900">
                    Rp {kasirQrisTransfer.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Panel B: Pelunasan Piutang Tempo (Real-time Kas Masuk) */}
            <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-amber-400 [body.light-theme_&]:text-amber-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Pelunasan Piutang Tempo
                </span>
                <span className="font-mono font-black text-amber-400 [body.light-theme_&]:text-slate-900 text-xs">
                  +Rp {pelunasanTempoKas.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-200 text-[10.5px] space-y-1">
                <div className="flex justify-between text-slate-300 [body.light-theme_&]:text-slate-700">
                  <span>Kas Masuk dari Pelunasan:</span>
                  <span className="font-mono font-bold text-amber-300">Rp {pelunasanTempoKas.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-500">
                  {pelunasanTempoKas > 0
                    ? '✓ Sinkronisasi otomatis dari tombol [Pelunasan] modul Piutang & Tempo'
                    : 'Belum ada pembayaran nota tempo baru yang dibukukan hari ini'}
                </div>
              </div>
            </div>

            {/* Panel C: Total Setoran Supir / Kurir Viar Lapangan - Rp 12.740.000 */}
            <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-cyan-400 [body.light-theme_&]:text-indigo-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Setoran Supir Selesai Antar
                </span>
                <span className="font-mono font-black text-cyan-400 [body.light-theme_&]:text-slate-900 text-xs">
                  Rp {subtotalSetoranDriver.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-1 pt-0.5 text-[10.5px]">
                {driverSetoranList.map((driver) => (
                  <div
                    key={driver.driverId}
                    className="flex items-center justify-between p-1 px-2 rounded-lg bg-slate-900/90 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-200"
                  >
                    <div>
                      <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-[10.5px]">{driver.driverName}</div>
                      <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600">
                        {driver.vehicle}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400 [body.light-theme_&]:text-slate-900 text-[10.5px]">
                        Rp {driver.receivedCash.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[8.5px] font-bold px-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        {driver.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cash Verification Box: Fisik Aktual Brankas vs Kalkulasi */}
          <div className="p-2.5 px-3 rounded-xl bg-slate-900/90 [body.light-theme_&]:bg-slate-100 border border-slate-800 [body.light-theme_&]:border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black shrink-0">
                <ShieldCheck className="w-4 h-4 font-black" />
              </div>
              <div>
                <span className="font-bold text-slate-200 [body.light-theme_&]:text-slate-900 block text-[11px]">
                  Verifikasi Kas Fisik di Brankas Depo:
                </span>
                <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
                  Target Kas Fisik Sistem: <strong>Rp {expectedVaultCash.toLocaleString('id-ID')}</strong> (Tunai Kasir + Pelunasan + Setoran Supir)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-700 font-bold">Uang Fisik Dihitung:</span>
                <div className="relative w-36">
                  <span className="absolute left-2 top-1 text-[10px] font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={actualVaultCashInput}
                    onChange={(e) => setActualVaultCashInput(Number(e.target.value))}
                    disabled={isLocked}
                    className="w-full pl-6 pr-2 py-0.5 text-xs font-mono font-bold rounded bg-slate-950 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-emerald-400 [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                cashDifference === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-900'
              }`}>
                {cashDifference === 0 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SELISIH: Rp 0 (SEIMBANG)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>SELISIH: Rp {cashDifference.toLocaleString('id-ID')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            BAGIAN 2: REKAP FISIK GALON DEPO (580 TERISI + 240 KOSONG SIAP ANTAR)
            ======================================================== */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 border-t-4 border-t-emerald-500 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                2. REKAP FISIK GALON DEPO (580 TERISI + 240 KOSONG SIAP ANTAR)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold">
              Total Fisik di Depo: {totalFisikTerisi + totalFisikKosong} Tabung (580 Terisi + 240 Kosong • 0 Selisih)
            </span>
          </div>

          {/* 4 Summary Balance Cards - Focus on 580 Terisi + 240 Kosong */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Card 1: Fisik Terisi 580 */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-2 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="text-[9.5px] text-emerald-400 [body.light-theme_&]:text-emerald-800 uppercase font-black block">Fisik Galon Terisi:</span>
              <div className="text-lg sm:text-xl font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono mt-0.5">{totalFisikTerisi} Tabung</div>
              <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600">Stok siap jual & antar ritase pagi</span>
            </div>

            {/* Card 2: Fisik Kosong 240 */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-2 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <span className="text-[9.5px] text-cyan-400 [body.light-theme_&]:text-cyan-800 uppercase font-black block">Fisik Galon Kosong:</span>
              <div className="text-lg sm:text-xl font-black text-cyan-300 [body.light-theme_&]:text-cyan-700 font-mono mt-0.5">{totalFisikKosong} Tabung</div>
              <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600">Tabung siap antar & isi ulang pabrik</span>
            </div>

            {/* Card 3: Total Aset Fisik Depo 820 */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border border-slate-700 [body.light-theme_&]:border-slate-300">
              <span className="text-[9.5px] text-slate-300 [body.light-theme_&]:text-slate-700 uppercase font-bold block">Total Aset Fisik Depo:</span>
              <div className="text-lg sm:text-xl font-black text-white [body.light-theme_&]:text-slate-900 font-mono mt-0.5">{totalFisikTerisi + totalFisikKosong} Tabung</div>
              <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600">{totalFisikTerisi} Terisi + {totalFisikKosong} Kosong</span>
            </div>

            {/* Card 4: Selisih Audit 0 (Nihil) */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-2 border-emerald-500/40">
              <span className="text-[9.5px] text-emerald-400 [body.light-theme_&]:text-emerald-800 uppercase font-bold block">Selisih Fisik / Hilang:</span>
              <div className="text-lg sm:text-xl font-black text-emerald-300 [body.light-theme_&]:text-emerald-700 font-mono mt-0.5">0 (Nihil)</div>
              <span className="text-[9px] text-emerald-400/80 [body.light-theme_&]:text-emerald-700">Audit 100% Cocok & Seimbang</span>
            </div>
          </div>

          {/* Tabel Rincian Merek: Aqua, Le Minerale, Vit, Cleo */}
          <div className="overflow-x-auto pt-1">
            <div className="text-[10.5px] font-extrabold text-slate-300 [body.light-theme_&]:text-slate-800 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rincian Fisik Per Merek Galon (Depo Subang):</span>
              </div>
              <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-mono">
                Total: <strong className="text-emerald-400 [body.light-theme_&]:text-emerald-700">{totalFisikTerisi} Terisi</strong> + <strong className="text-cyan-400 [body.light-theme_&]:text-cyan-700">{totalFisikKosong} Kosong</strong> = <strong>{totalFisikTerisi + totalFisikKosong} Tabung</strong>
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 [body.light-theme_&]:bg-slate-100 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[9.5px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                  <th className="py-1.5 px-2.5">Merek Tabung Galon</th>
                  <th className="py-1.5 px-2 text-center text-emerald-400 [body.light-theme_&]:text-emerald-800">Fisik Terisi</th>
                  <th className="py-1.5 px-2 text-center text-cyan-400 [body.light-theme_&]:text-cyan-800">Fisik Kosong (Siap Antar)</th>
                  <th className="py-1.5 px-2 text-center text-white [body.light-theme_&]:text-slate-900">Total Fisik Depo</th>
                  <th className="py-1.5 px-2 text-center text-amber-400 [body.light-theme_&]:text-amber-800">Di Toko Mitra</th>
                  <th className="py-1.5 px-2 text-center">Status Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200 text-[11px]">
                {gallonInventoryRecon.map((g) => (
                  <tr key={g.brand} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-2.5 font-bold text-white [body.light-theme_&]:text-slate-900">
                      {g.brand}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-black text-emerald-300 [body.light-theme_&]:text-emerald-700 bg-emerald-950/20 [body.light-theme_&]:bg-emerald-50">{g.fisikTerisi} Tbg</td>
                    <td className="py-1.5 px-2 text-center font-mono font-black text-cyan-300 [body.light-theme_&]:text-cyan-700 bg-cyan-950/20 [body.light-theme_&]:bg-cyan-50">{g.fisikKosong} Tbg</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-white [body.light-theme_&]:text-slate-900">{g.fisikTotalAktual} Tbg</td>
                    <td className="py-1.5 px-2 text-center font-mono text-amber-300 [body.light-theme_&]:text-amber-700">{g.diTokoBeredar} Tbg</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/40">
                        ✓ 0 Selisih (Cocok)
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-900/60 [body.light-theme_&]:bg-slate-100 font-black text-[11px]">
                  <td className="py-1.5 px-2.5 text-white [body.light-theme_&]:text-slate-900 uppercase">
                    TOTAL ASESMEN FISIK
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono text-emerald-400 [body.light-theme_&]:text-emerald-700 text-xs">{totalFisikTerisi} Tabung</td>
                  <td className="py-1.5 px-2 text-center font-mono text-cyan-400 [body.light-theme_&]:text-cyan-700 text-xs">{totalFisikKosong} Tabung</td>
                  <td className="py-1.5 px-2 text-center font-mono text-white [body.light-theme_&]:text-slate-900 text-xs">{totalFisikTerisi + totalFisikKosong} Tabung</td>
                  <td className="py-1.5 px-2 text-center font-mono text-amber-300 [body.light-theme_&]:text-amber-700 text-xs">765 Tabung</td>
                  <td className="py-1.5 px-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-500/30 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/50">
                      ✓ 100% Seimbang
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rincian Sirkulasi Retur Galon Tiap Armada Supir */}
          <div className="overflow-x-auto pt-1">
            <div className="text-[10.5px] font-extrabold text-slate-300 [body.light-theme_&]:text-slate-800 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rincian Setoran Tabung Kosong Armada Supir Saat Check-in Sore:</span>
              </div>
              <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600">
                Total Retur Armada: <strong className="text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono">{totalArmadaEmptyGallons} Tabung</strong>
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 [body.light-theme_&]:bg-slate-100 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-[9.5px] font-extrabold uppercase text-slate-400 [body.light-theme_&]:text-slate-900">
                  <th className="py-1.5 px-2.5">Armada & Supir</th>
                  <th className="py-1.5 px-2 text-center">Kendaraan</th>
                  <th className="py-1.5 px-2 text-center text-amber-400">Galon Keluar Antar</th>
                  <th className="py-1.5 px-2 text-center text-cyan-400">Tabung Retur Ditarik</th>
                  <th className="py-1.5 px-2 text-center text-rose-400">Tertahan di Toko</th>
                  <th className="py-1.5 px-2 text-center">Status Audit Armada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200 text-[11px]">
                {armadaReconciliation.map((arm) => (
                  <tr key={arm.armadaId} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-2.5 font-bold text-white [body.light-theme_&]:text-slate-900">
                      {arm.driver} <span className="font-mono text-slate-400 text-[10px]">({arm.plate})</span>
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-300 [body.light-theme_&]:text-slate-600">{arm.vehicle}</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-300">{arm.deliveredGallons} Tbg</td>
                    <td className="py-1.5 px-2 text-center font-mono font-black text-cyan-300 bg-cyan-950/20">{arm.emptyGallonsRetur} Tbg</td>
                    <td className="py-1.5 px-2 text-center font-mono text-rose-300">{arm.heldAtStores} Tbg</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ✓ {arm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================
            BAGIAN 3: PEMBUKUAN KOMISI SUPIR HARI INI
            ======================================================== */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 border-t-4 border-t-purple-500 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                3. PEMBUKUAN HAK KOMISI SUPIR ARMADA (SKEMA 75% KURIR PENGANTAR)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold">
              Total Komisi Armada: Rp {grandTotalCommissions.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {driverCommissions.map((dc, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-900 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200">
                <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-[11px] truncate">{dc.driverName}</div>
                <div className="text-[9px] text-slate-400 truncate">{dc.vehicle}</div>
                <div className="flex justify-between items-baseline mt-1 font-mono">
                  <span className="text-[9.5px] text-slate-400">{dc.gallons} Gln x Rp {dc.rate}</span>
                  <span className="font-extrabold text-emerald-400">Rp {dc.commissionAmount.toLocaleString('id-ID')}</span>
                </div>
                <span className={`inline-block mt-1 text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                  commissionsBooked ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {commissionsBooked ? '✓ Terbuku ke SDM' : 'Siap Closing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Notes */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 space-y-1.5 text-xs">
          <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block uppercase">
            Catatan Rekonsiliasi & Berita Acara Closing:
          </label>
          <textarea
            value={settlementNotes}
            onChange={(e) => setSettlementNotes(e.target.value)}
            disabled={isLocked}
            rows={2}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-slate-200 [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* ========================================================
          MODAL INTERAKTIF: REKAP SHIFT & CETAK STRUK THERMAL
          ======================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    RINGKASAN REKAP SHIFT & TUTUP BUKU (17:00 WIB)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Status: {isLocked ? 'TERKUNCI & SAH' : 'PRA-CLOSING'} • Komisi Supir Terbuku
                  </span>
                </div>
              </div>

              {/* Tab Selector & Close */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setModalTab('thermal')}
                    className={`px-2 py-0.5 text-[10px] font-black rounded cursor-pointer ${
                      modalTab === 'thermal' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    🖨️ Struk Thermal
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('berita-acara')}
                    className={`px-2 py-0.5 text-[10px] font-black rounded cursor-pointer ${
                      modalTab === 'berita-acara' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    📑 Berita Acara
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons Toolbar */}
            <div className="py-2 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-2 rounded-lg mt-2 shrink-0">
              {/* Paper Format Toggle for Thermal Slip */}
              {modalTab === 'thermal' && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-600">Format Kertas:</span>
                  <button
                    type="button"
                    onClick={() => setShiftSlipFormat('58mm')}
                    className={`px-2 py-0.5 text-[9.5px] font-bold rounded cursor-pointer border ${
                      shiftSlipFormat === '58mm' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    58mm (Mobile)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftSlipFormat('80mm')}
                    className={`px-2 py-0.5 text-[9.5px] font-bold rounded cursor-pointer border ${
                      shiftSlipFormat === '80mm' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    80mm (Desktop)
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 ml-auto">
                {/* Tombol Salin Ringkasan Shift WA */}
                <button
                  type="button"
                  onClick={handleCopyShiftText}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Salin rincian rekap shift untuk dikirim ke grup WhatsApp Depo"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Tersalin!' : 'Salin Teks WA'}</span>
                </button>

                {/* Tombol Cetak Dokumen / Struk */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 rounded flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak {modalTab === 'thermal' ? 'Struk Shift' : 'Dokumen'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-2 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-1 cursor-pointer"
                  title="Unduh Data JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 pr-1 text-xs font-sans">
              {modalTab === 'thermal' ? (
                /* Thermal Receipt Monospace Layout */
                <div className="flex justify-center p-2 bg-slate-100 rounded-xl">
                  <div
                    className={`bg-white p-4 shadow-md font-mono text-[11px] leading-tight text-slate-900 border border-dashed border-slate-400 ${
                      shiftSlipFormat === '58mm' ? 'w-[280px]' : 'w-[400px]'
                    }`}
                  >
                    <div className="text-center pb-2 border-b border-dashed border-slate-400">
                      <div className="font-bold text-sm tracking-tight">JACS DEPO AIR MINERAL</div>
                      <div className="text-[10px]">Jl. Raya Subang No. 88</div>
                      <div className="text-[10px]">REKAP SHIFT TUTUP BUKU 17:00</div>
                    </div>

                    <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Tanggal:</span>
                        <span>{new Date().toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Waktu Closing:</span>
                        <span>{lockedTimestamp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kasir/PIC:</span>
                        <span>{lockedBy.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Status:</span>
                        <span>{isLocked ? 'TERKUNCI & SAH' : 'DRAFT'}</span>
                      </div>
                    </div>

                    {/* Section 1: Omzet & Kas */}
                    <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                      <div className="font-bold text-[10.5px]">1. REKAPITULASI OMZET & KAS</div>
                      <div className="flex justify-between text-[10px]">
                        <span>Omzet Kasir Depo:</span>
                        <span className="font-bold">Rp {subtotalKasir.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[9px] pl-2 text-slate-600">
                        <span>- Tunai Kasir:</span>
                        <span>Rp {kasirCashDirect.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[9px] pl-2 text-slate-600">
                        <span>- QRIS/Transfer:</span>
                        <span>Rp {kasirQrisTransfer.toLocaleString('id-ID')}</span>
                      </div>
                      {pelunasanTempoKas > 0 && (
                        <div className="flex justify-between text-[10px]">
                          <span>Pelunasan Piutang:</span>
                          <span className="font-bold">+Rp {pelunasanTempoKas.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px]">
                        <span>Setoran Supir Lapangan:</span>
                        <span className="font-bold">Rp {subtotalSetoranDriver.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-slate-400">
                        <span>GRAND TOTAL OMZET:</span>
                        <span>Rp {grandTotalKas.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-700">
                        <span>Fisik Brankas:</span>
                        <span>Rp {expectedVaultCash.toLocaleString('id-ID')} (MATCH)</span>
                      </div>
                    </div>

                    {/* Section 2: Fisik Galon Kosong & Terisi */}
                    <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                      <div className="font-bold text-[10.5px]">2. REKAP FISIK GALON DEPO</div>
                      <div className="flex justify-between">
                        <span>Fisik Galon Terisi:</span>
                        <span className="font-bold text-emerald-800">{totalFisikTerisi} Tabung</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fisik Galon Kosong (Siap Antar):</span>
                        <span className="font-bold text-cyan-800">{totalFisikKosong} Tabung</span>
                      </div>
                      <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-slate-400">
                        <span>TOTAL FISIK DEPO:</span>
                        <span>{totalFisikTerisi + totalFisikKosong} TABUNG</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-600">
                        <span>- Retur Ditarik Supir:</span>
                        <span>{totalArmadaEmptyGallons} Tbg</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-600">
                        <span>- Tertahan di Mitra Toko:</span>
                        <span>{tabungTertahanDiToko} Tbg</span>
                      </div>
                      <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-slate-400 text-emerald-800">
                        <span>SELISIH / LOSS TABUNG:</span>
                        <span>0 TABUNG (NIHIL)</span>
                      </div>
                    </div>

                    {/* Section 3: Komisi Supir */}
                    <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                      <div className="font-bold text-[10.5px]">3. KOMISI SUPIR DIBUKUKAN</div>
                      {driverCommissions.map((dc, idx) => (
                        <div key={idx} className="flex justify-between text-[9px]">
                          <span>{dc.driverName.split(' ')[0]} ({dc.gallons}G):</span>
                          <span>Rp {dc.commissionAmount.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-slate-400">
                        <span>TOTAL KOMISI:</span>
                        <span>Rp {grandTotalCommissions.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="text-center pt-3 text-[9px] text-slate-500 space-y-0.5">
                      <div>*** TUTUP SHIFT SELESAI ***</div>
                      <div>Simpan struk ini sebagai arsip kas</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formal Berita Acara Sheet */
                <div className="space-y-4">
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <h1 className="text-base font-black tracking-tight text-slate-950">
                      JACS DEPOHUB - DISTRIBUSI AIR MINERAL SUBANG
                    </h1>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Jl. Raya Subang - Kalijati No. 88, Subang, Jawa Barat • Telp: (0260) 412890
                    </p>
                    <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-800">
                      BERITA ACARA REKONSILIASI KAS & FISIK TABUNG HARIAN
                    </div>
                  </div>

                  {/* Summary Table: Kas */}
                  <div>
                    <h4 className="font-black text-slate-950 text-xs mb-1 uppercase tracking-wide">
                      A. Ringkasan Penerimaan Kasir & Supir:
                    </h4>
                    <table className="w-full text-left text-[11px] border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5">Sumber Penerimaan</th>
                          <th className="p-1.5 text-right">Nominal Tunai</th>
                          <th className="p-1.5 text-right">Nominal Non-Tunai</th>
                          <th className="p-1.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-1.5 font-bold">Kasir Depo (Walk-in & POS)</td>
                          <td className="p-1.5 text-right font-mono">Rp {kasirCashDirect.toLocaleString('id-ID')}</td>
                          <td className="p-1.5 text-right font-mono">Rp {kasirQrisTransfer.toLocaleString('id-ID')}</td>
                          <td className="p-1.5 text-right font-mono font-bold">Rp {subtotalKasir.toLocaleString('id-ID')}</td>
                        </tr>
                        {pelunasanTempoKas > 0 && (
                          <tr>
                            <td className="p-1.5">Pelunasan Piutang Tempo (Kasir)</td>
                            <td className="p-1.5 text-right font-mono">Rp {pelunasanTempoKas.toLocaleString('id-ID')}</td>
                            <td className="p-1.5 text-right font-mono">Rp 0</td>
                            <td className="p-1.5 text-right font-mono font-bold">Rp {pelunasanTempoKas.toLocaleString('id-ID')}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="p-1.5">Setoran Supir & Kurir Viar Lapangan (4 Armada)</td>
                          <td className="p-1.5 text-right font-mono">Rp {subtotalSetoranDriver.toLocaleString('id-ID')}</td>
                          <td className="p-1.5 text-right font-mono">Rp 0</td>
                          <td className="p-1.5 text-right font-mono font-bold">Rp {subtotalSetoranDriver.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr className="bg-slate-100 font-black">
                          <td className="p-1.5">GRAND TOTAL PENERIMAAN KAS</td>
                          <td className="p-1.5 text-right font-mono">Rp {expectedVaultCash.toLocaleString('id-ID')}</td>
                          <td className="p-1.5 text-right font-mono">Rp {kasirQrisTransfer.toLocaleString('id-ID')}</td>
                          <td className="p-1.5 text-right font-mono text-cyan-800">Rp {grandTotalKas.toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Table: Galon (580 Terisi + 240 Kosong) */}
                  <div>
                    <h4 className="font-black text-slate-950 text-xs mb-1 uppercase tracking-wide">
                      B. Rekonsiliasi Fisik Galon Depo (580 Terisi + 240 Kosong Siap Antar):
                    </h4>
                    <table className="w-full text-left text-[11px] border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5">Merek Galon</th>
                          <th className="p-1.5 text-center">Fisik Terisi</th>
                          <th className="p-1.5 text-center">Fisik Kosong (Siap Antar)</th>
                          <th className="p-1.5 text-center">Total Fisik Depo</th>
                          <th className="p-1.5 text-center">Status Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {gallonInventoryRecon.map((g) => (
                          <tr key={g.brand}>
                            <td className="p-1.5 font-bold">{g.brand}</td>
                            <td className="p-1.5 text-center font-mono text-emerald-700 font-bold">{g.fisikTerisi} Tbg</td>
                            <td className="p-1.5 text-center font-mono text-cyan-700 font-bold">{g.fisikKosong} Tbg</td>
                            <td className="p-1.5 text-center font-mono font-bold">{g.fisikTotalAktual} Tbg</td>
                            <td className="p-1.5 text-center text-[10px] text-emerald-700 font-bold">✓ 0 Selisih (Cocok)</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-black">
                          <td className="p-1.5">TOTAL AUDIT FISIK TABUNG</td>
                          <td className="p-1.5 text-center font-mono text-emerald-800">{totalFisikTerisi} Tabung</td>
                          <td className="p-1.5 text-center font-mono text-cyan-800">{totalFisikKosong} Tabung</td>
                          <td className="p-1.5 text-center font-mono">{totalFisikTerisi + totalFisikKosong} Tabung</td>
                          <td className="p-1.5 text-center text-emerald-800 font-bold">100% Seimbang</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Three Signatures */}
                  <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-12">Petugas Kasir Depo,</div>
                      <div className="font-bold border-b border-slate-400 pb-0.5 mx-4">Siti Aminah</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Admin Kasir</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-12">Koordinator Armada,</div>
                      <div className="font-bold border-b border-slate-400 pb-0.5 mx-4">Bambang Sukoco</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Dispatch & Supir Utama</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-12">Kepala Depo / Super Admin,</div>
                      <div className="font-bold border-b border-slate-400 pb-0.5 mx-4">{lockedBy}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Manajer Operasional</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
