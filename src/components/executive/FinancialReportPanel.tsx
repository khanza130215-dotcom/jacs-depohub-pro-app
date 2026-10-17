import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  X,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { getDepoProfile } from '../../utils/depoProfile';
import { ReceivableItem } from '../../types';

interface FinancialReportPanelProps {
  reportData: {
    // 1. Laba Rugi
    revenueGallon: number;
    revenueDus: number;
    totalRevenue: number;
    hppGallon: number;
    hppDus: number;
    totalHpp: number;
    grossProfit: number;
    grossMarginPct: number;
    // Beban Operasional
    driverCommissionCost: number;
    pettyCashBreakdown: {
      fuelCost: number;
      driverMealCost: number;
      suppliesCost: number;
      repairCost: number;
      maintenanceCost: number;
      othersCost: number;
      totalPettyCash: number;
    };
    utilityCost: number;
    totalOpex: number;
    netProfit: number;
    netMarginPct: number;

    // 2. Arus Kas (Cashflow)
    cashInflowCash: number;
    cashInflowTransfer: number;
    cashInflowQris: number;
    cashInflowReceivables: number;
    totalCashInflow: number;
    cashOutflowPettyCash: number;
    cashOutflowCommission: number;
    cashOutflowPoProcurement: number;
    totalCashOutflow: number;
    netCashflow: number;

    // 3. Neraca Piutang
    currentReceivables: number; // <= 14 hari
    overdueReceivables: number; // > 14 hari
    totalReceivables: number;
    collectibilityRatioPct: number;
    receivablesList: ReceivableItem[];
  };
}

export const FinancialReportPanel: React.FC<FinancialReportPanelProps> = ({ reportData }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const depoProfile = getDepoProfile();

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `*LAPORAN KEUANGAN & BISNIS RESMI - ${depoProfile.name}*
Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
==================================
1. LAPORAN LABA RUGI (INCOME STATEMENT)
- Pendapatan Penjualan: Rp ${reportData.totalRevenue.toLocaleString('id-ID')}
  * Galon 19L: Rp ${reportData.revenueGallon.toLocaleString('id-ID')}
  * Dus Kemasan: Rp ${reportData.revenueDus.toLocaleString('id-ID')}
- (-) Harga Pokok Penjualan (HPP): Rp ${reportData.totalHpp.toLocaleString('id-ID')}
- (=) LABA KOTOR (GROSS PROFIT): Rp ${reportData.grossProfit.toLocaleString('id-ID')} (${reportData.grossMarginPct}%)
- (-) Beban Operasional: Rp ${reportData.totalOpex.toLocaleString('id-ID')}
  * Komisi Supir: Rp ${reportData.driverCommissionCost.toLocaleString('id-ID')}
  * Kas Kecil Operasional: Rp ${reportData.pettyCashBreakdown.totalPettyCash.toLocaleString('id-ID')}
  * Listrik & Air Depo: Rp ${reportData.utilityCost.toLocaleString('id-ID')}
- (=) LABA BERSIH OPERASIONAL: Rp ${reportData.netProfit.toLocaleString('id-ID')} (${reportData.netMarginPct}%)

2. LAPORAN ARUS KAS (CASHFLOW)
- Total Kas Masuk Riil: Rp ${reportData.totalCashInflow.toLocaleString('id-ID')}
- Total Kas Keluar Riil: Rp ${reportData.totalCashOutflow.toLocaleString('id-ID')}
- Posisi Kas Bersih: Rp ${reportData.netCashflow.toLocaleString('id-ID')}

3. NERACA SALDO PIUTANG TOKO
- Total Piutang Toko Berjalan: Rp ${reportData.currentReceivables.toLocaleString('id-ID')}
- Piutang Jatuh Tempo (>14 Hari): Rp ${reportData.overdueReceivables.toLocaleString('id-ID')}
- Total Tagihan Aktif: Rp ${reportData.totalReceivables.toLocaleString('id-ID')}
- Kolektibilitas: ${reportData.collectibilityRatioPct}% Lancar
==================================
Executive Manager • Sistem JAC-POS Pro`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Cetak Button */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
              <span>Laporan Keuangan & Bisnis (Format Standar Akuntansi)</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                AUDITED
              </span>
            </h3>
            <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
              Laba Rugi (Income Statement), Arus Kas (Cashflow), dan Neraca Saldo Piutang Toko
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Tersalin!' : 'Salin Ringkasan'}</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Ekspor Laporan Ringkas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BAGIAN 1: LAPORAN LABA RUGI (INCOME STATEMENT) */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
            <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>1. Laporan Laba Rugi (Income Statement)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Periode: Hari Ini</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* I. PENDAPATAN */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-800">
                <span>I. PENDAPATAN PENJUALAN USAHA</span>
              </div>
              <div className="pl-3 space-y-0.5 text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600">
                <div className="flex justify-between">
                  <span>• Penjualan Galon 19L (Refill & Tabung Baru):</span>
                  <span className="text-white [body.light-theme_&]:text-slate-900">
                    Rp {reportData.revenueGallon.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• Penjualan Dus Kemasan & Botol Mini:</span>
                  <span className="text-white [body.light-theme_&]:text-slate-900">
                    Rp {reportData.revenueDus.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <div className="flex justify-between font-black text-cyan-400 text-xs pt-1 border-t border-slate-800">
                <span>Total Pendapatan Penjualan:</span>
                <span>Rp {reportData.totalRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* II. HPP */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-800">
                <span>II. HARGA POKOK PENJUALAN (HPP PABRIK)</span>
              </div>
              <div className="pl-3 space-y-0.5 text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600">
                <div className="flex justify-between">
                  <span>• Modal Air Galon Tebus Pabrik:</span>
                  <span className="text-rose-400 [body.light-theme_&]:text-rose-600">
                    (Rp {reportData.hppGallon.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• Modal Dus Kemasan Tebus Pabrik:</span>
                  <span className="text-rose-400 [body.light-theme_&]:text-rose-600">
                    (Rp {reportData.hppDus.toLocaleString('id-ID')})
                  </span>
                </div>
              </div>
              <div className="flex justify-between font-black text-rose-400 text-xs pt-1 border-t border-slate-800">
                <span>(-) Total Beban Pokok (HPP):</span>
                <span>(Rp {reportData.totalHpp.toLocaleString('id-ID')})</span>
              </div>
            </div>

            {/* LABA KOTOR */}
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-500/40 flex justify-between font-black text-xs text-emerald-400 [body.light-theme_&]:bg-emerald-50">
              <span>(=) LABA KOTOR (GROSS PROFIT):</span>
              <span>
                Rp {reportData.grossProfit.toLocaleString('id-ID')} ({reportData.grossMarginPct}%)
              </span>
            </div>

            {/* III. OPEX */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-800">
                <span>III. BEBAN OPERASIONAL DEPO (OPEX)</span>
              </div>
              <div className="pl-3 space-y-0.5 text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600">
                <div className="flex justify-between">
                  <span>• Alokasi Komisi Supir & Kurir:</span>
                  <span>(Rp {reportData.driverCommissionCost.toLocaleString('id-ID')})</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>• Kas Kecil Operasional Depo:</span>
                  <span className="text-amber-400">
                    (Rp {reportData.pettyCashBreakdown.totalPettyCash.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="pl-2 space-y-0.5 text-[10px] text-slate-500">
                  <div className="flex justify-between">
                    <span>- BBM Armada Solar/Bensin:</span>
                    <span>Rp {reportData.pettyCashBreakdown.fuelCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- Uang Makan / Jalan Supir:</span>
                    <span>Rp {reportData.pettyCashBreakdown.driverMealCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- Tisu Pembersih & Segel Galon:</span>
                    <span>Rp {reportData.pettyCashBreakdown.suppliesCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- Tambal Ban & Servis Ringan:</span>
                    <span>Rp {reportData.pettyCashBreakdown.repairCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- Maintenance Mesin Cuci/Filter:</span>
                    <span>Rp {reportData.pettyCashBreakdown.maintenanceCost.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>• Beban Listrik, Air & Depresiasi:</span>
                  <span>(Rp {reportData.utilityCost.toLocaleString('id-ID')})</span>
                </div>
              </div>
              <div className="flex justify-between font-black text-amber-400 text-xs pt-1 border-t border-slate-800">
                <span>(-) Total Beban Operasional:</span>
                <span>(Rp {reportData.totalOpex.toLocaleString('id-ID')})</span>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex justify-between items-center font-black text-sm text-emerald-400 [body.light-theme_&]:bg-emerald-50">
              <span className="font-sans">(=) LABA BERSIH OPERASIONAL:</span>
              <span className="text-base sm:text-lg">
                Rp {reportData.netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: LAPORAN ARUS KAS (CASHFLOW STATEMENT) & NERACA PIUTANG */}
        <div className="space-y-4">
          {/* Laporan Arus Kas Ringkas */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
              <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>2. Laporan Arus Kas Ringkas (Cashflow Statement)</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">Likuiditas Riil</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* Kas Masuk */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-emerald-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>UANG MASUK KASIR (INFLOW)</span>
                  </span>
                  <span>Rp {reportData.totalCashInflow.toLocaleString('id-ID')}</span>
                </div>
                <div className="pl-3 space-y-0.5 text-[10.5px] text-slate-400">
                  <div className="flex justify-between">
                    <span>• Penerimaan Tunai Kasir POS:</span>
                    <span className="text-slate-200 [body.light-theme_&]:text-slate-800">
                      Rp {reportData.cashInflowCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Penerimaan Transfer Bank:</span>
                    <span className="text-slate-200 [body.light-theme_&]:text-slate-800">
                      Rp {reportData.cashInflowTransfer.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Penerimaan QRIS Instan:</span>
                    <span className="text-slate-200 [body.light-theme_&]:text-slate-800">
                      Rp {reportData.cashInflowQris.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Pelunasan Piutang Toko Hari Ini:</span>
                    <span className="text-emerald-400">
                      Rp {reportData.cashInflowReceivables.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kas Keluar */}
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between font-bold text-rose-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>PENGELUARAN RIIL DEPO (OUTFLOW)</span>
                  </span>
                  <span>(Rp {reportData.totalCashOutflow.toLocaleString('id-ID')})</span>
                </div>
                <div className="pl-3 space-y-0.5 text-[10.5px] text-slate-400">
                  <div className="flex justify-between">
                    <span>• Realisasi Kas Kecil Fisik:</span>
                    <span className="text-slate-200 [body.light-theme_&]:text-slate-800">
                      (Rp {reportData.cashOutflowPettyCash.toLocaleString('id-ID')})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Pembayaran Komisi Armada:</span>
                    <span className="text-slate-200 [body.light-theme_&]:text-slate-800">
                      (Rp {reportData.cashOutflowCommission.toLocaleString('id-ID')})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Tebus PO Barang Pabrik:</span>
                    <span className="text-slate-200 [body.light-theme_&]:text-slate-800">
                      (Rp {reportData.cashOutflowPoProcurement.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Cashflow */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/40 flex justify-between font-black text-xs text-cyan-400 [body.light-theme_&]:bg-cyan-50">
                <span>POSISI KAS BERSIH (NET CASHFLOW):</span>
                <span>Rp {reportData.netCashflow.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Neraca Ringkas Saldo Piutang */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
              <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>3. Neraca Ringkas Saldo Piutang Toko</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                Kolektibilitas: {reportData.collectibilityRatioPct}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 [body.light-theme_&]:bg-slate-50">
                <span className="text-[10px] text-slate-400 block font-sans">Piutang Berjalan (≤14 Hari):</span>
                <strong className="text-white [body.light-theme_&]:text-slate-900 text-sm block mt-0.5">
                  Rp {reportData.currentReceivables.toLocaleString('id-ID')}
                </strong>
                <span className="text-[9.5px] text-emerald-400 font-bold block mt-0.5">Status Lancar</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-rose-900/60 [body.light-theme_&]:bg-rose-50">
                <span className="text-[10px] text-rose-400 block font-sans">Jatuh Tempo (&gt;14 Hari):</span>
                <strong className="text-rose-400 text-sm block mt-0.5">
                  Rp {reportData.overdueReceivables.toLocaleString('id-ID')}
                </strong>
                <span className="text-[9.5px] text-rose-500 font-bold block mt-0.5">Wajib Penagihan</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-slate-800">
              <span className="text-slate-400 font-sans">Total Saldo Tagihan Pelanggan:</span>
              <strong className="text-white [body.light-theme_&]:text-slate-900 font-black">
                Rp {reportData.totalReceivables.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL CETAK / EKSPOR DOKUMEN RESMI STANDAR AKUNTANSI
          ======================================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto print:m-0 print:p-4 print:shadow-none">
            {/* Action Bar (Hidden on print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-700 text-xs font-black">
                  PRATINJAU DOKUMEN RESMI
                </span>
                <span className="text-xs text-slate-500">Standar Akuntansi Keuangan Depo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* KOP RESMI DEPO */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                {depoProfile.name}
              </h2>
              <p className="text-xs text-slate-600 max-w-xl mx-auto">{depoProfile.address}</p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[10.5px] font-mono text-slate-500 pt-1">
                <span>NIB: {depoProfile.nib}</span>
                <span>•</span>
                <span>NPWP: {depoProfile.npwp}</span>
                <span>•</span>
                <span>Hotline: {depoProfile.phone}</span>
              </div>
            </div>

            {/* JUDUL DOKUMEN */}
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                LAPORAN AUDIT LABA RUGI & ARUS KAS BISNIS
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                No. Dokumen: FIN-REP/{new Date().getFullYear()}/{Date.now().toString().slice(-4)} • Tanggal Cetak:{' '}
                {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
              </p>
            </div>

            {/* TABEL LABA RUGI RESMI */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="bg-slate-100 p-2 font-black text-slate-800 uppercase">
                I. LAPORAN LABA RUGI (INCOME STATEMENT)
              </div>
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 font-bold">1. Pendapatan Penjualan Kotor (Galon 19L & Kemasan)</td>
                    <td className="py-1.5 text-right font-black text-cyan-800">
                      Rp {reportData.totalRevenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <td className="py-1.5 pl-4">2. (-) Beban Pokok Penjualan (HPP Tebus Pabrik)</td>
                    <td className="py-1.5 text-right text-rose-700">
                      (Rp {reportData.totalHpp.toLocaleString('id-ID')})
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-400 bg-emerald-50/60 font-black">
                    <td className="py-2 pl-2">(=) LABA KOTOR (GROSS PROFIT)</td>
                    <td className="py-2 text-right text-emerald-800">
                      Rp {reportData.grossProfit.toLocaleString('id-ID')} ({reportData.grossMarginPct}%)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <td className="py-1.5 pl-4">3. (-) Komisi Supir & Tenaga Pengiriman</td>
                    <td className="py-1.5 text-right">
                      (Rp {reportData.driverCommissionCost.toLocaleString('id-ID')})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <td className="py-1.5 pl-4">
                      4. (-) Beban Kas Kecil Operasional (BBM, Konsumsi, Segel, Maintenance)
                    </td>
                    <td className="py-1.5 text-right text-amber-700">
                      (Rp {reportData.pettyCashBreakdown.totalPettyCash.toLocaleString('id-ID')})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <td className="py-1.5 pl-4">5. (-) Beban Listrik, Air & Perawatan Mesin Depo</td>
                    <td className="py-1.5 text-right">
                      (Rp {reportData.utilityCost.toLocaleString('id-ID')})
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-900 bg-emerald-100 font-black text-sm">
                    <td className="py-2 pl-2">(=) LABA BERSIH OPERASIONAL (NET PROFIT)</td>
                    <td className="py-2 text-right text-emerald-900">
                      Rp {reportData.netProfit.toLocaleString('id-ID')} ({reportData.netMarginPct}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TABEL ARUS KAS & PIUTANG */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="border border-slate-300 rounded-lg p-3 space-y-1">
                <span className="font-bold block text-slate-800 text-[11px]">
                  II. ARUS KAS RINGKAS (CASHFLOW)
                </span>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600">
                  <span>Kas Masuk Riil:</span>
                  <span className="font-bold text-emerald-700">
                    Rp {reportData.totalCashInflow.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kas Keluar Riil:</span>
                  <span className="font-bold text-rose-700">
                    (Rp {reportData.totalCashOutflow.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-300 font-black text-slate-900">
                  <span>Saldo Kas Bersih:</span>
                  <span>Rp {reportData.netCashflow.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-3 space-y-1">
                <span className="font-bold block text-slate-800 text-[11px]">
                  III. NERACA SALDO PIUTANG
                </span>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600">
                  <span>Piutang Lancar (≤14 Hari):</span>
                  <span>Rp {reportData.currentReceivables.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Piutang Jatuh Tempo (&gt;14 Hari):</span>
                  <span className="font-bold text-rose-600">
                    Rp {reportData.overdueReceivables.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-300 font-black text-slate-900">
                  <span>Total Tagihan Toko:</span>
                  <span>Rp {reportData.totalReceivables.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* KOLOM TANDA TANGAN RESMI */}
            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-12">Disiapkan Oleh,</span>
                <strong className="block font-black text-slate-900 underline">Ahmad Fauzi</strong>
                <span className="text-[10px] text-slate-500">Staf Administrasi & Kasir</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-12">Diverifikasi & Otorisasi,</span>
                <strong className="block font-black text-slate-900 underline">Executive Manager</strong>
                <span className="text-[10px] text-slate-500">Manajer Operasional Depo</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-12">Mengetahui & Menyetujui,</span>
                <strong className="block font-black text-slate-900 underline">Direktur Operasional</strong>
                <span className="text-[10px] text-slate-500">Pemilik / Owner Depo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
