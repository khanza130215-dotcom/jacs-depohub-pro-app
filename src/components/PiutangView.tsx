import React, { useState } from 'react';
import { ReceivableItem } from '../types';
import {
  FileText,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Share2,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Building2,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  Sparkles,
  Check,
  X,
  Printer,
  RotateCw,
} from 'lucide-react';

interface PiutangViewProps {
  receivables: ReceivableItem[];
  onPayReceivable: (id: string, amountPaid: number, note?: string) => void;
  onNavigateWhatsApp?: () => void;
  onLockSession?: () => void;
}

export const PiutangView: React.FC<PiutangViewProps> = ({
  receivables,
  onPayReceivable,
  onNavigateWhatsApp,
  onLockSession,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'Semua' | 'BELUM LUNAS' | 'Lewat Tempo' | 'Mendekati Tempo' | 'LUNAS' | 'Aman'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Modal State
  const [payingItem, setPayingItem] = useState<ReceivableItem | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai Depo' | 'Transfer Bank' | 'Titipan Supir'>('Tunai Depo');
  const [paymentCollector, setPaymentCollector] = useState<string>('Kasir Depo');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [returnedGallonsPayment, setReturnedGallonsPayment] = useState<number>(0);

  // WhatsApp Reminder Modal State
  const [waReminderItem, setWaReminderItem] = useState<ReceivableItem | null>(null);
  const [waCopySuccess, setWaCopySuccess] = useState(false);

  // Filtered Receivables
  const filteredReceivables = receivables.filter((item) => {
    const matchFilter = selectedFilter === 'Semua' ? true : item.status === selectedFilter;
    const matchSearch =
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery);
    return matchFilter && matchSearch;
  });

  // Summary Metrics
  const activeUnpaidReceivables = receivables.filter((r) => r.status !== 'LUNAS' && r.amount > 0);
  const totalPiutang = activeUnpaidReceivables.reduce((sum, r) => sum + r.amount, 0);
  const totalLunasNominal = receivables.filter((r) => r.status === 'LUNAS' || r.amount === 0).reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const totalGalonPinjam = receivables.reduce((sum, r) => sum + r.gallonsLoaned, 0);
  const countBelumLunas = receivables.filter((r) => r.status === 'BELUM LUNAS').length;
  const countLewatTempo = receivables.filter((r) => r.status === 'Lewat Tempo').length;
  const countMendekatiTempo = receivables.filter((r) => r.status === 'Mendekati Tempo').length;
  const countLunas = receivables.filter((r) => r.status === 'LUNAS' || r.amount === 0).length;
  const countAman = receivables.filter((r) => r.status === 'Aman').length;

  // Open Payment Modal
  const handleOpenPayModal = (item: ReceivableItem) => {
    setPayingItem(item);
    setPaymentAmountInput(item.amount);
    setPaymentNotes(`Pelunasan tagihan tempo invoice ${item.id}`);
    setReturnedGallonsPayment(0);
  };

  // Submit Payment
  const handleSubmitPayment = () => {
    if (!payingItem) return;
    if (paymentAmountInput <= 0) {
      alert('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }

    const note = `${paymentMethod} (${paymentCollector})${paymentNotes ? ` - ${paymentNotes}` : ''}${
      returnedGallonsPayment > 0 ? ` [Retur ${returnedGallonsPayment} tabung galon]` : ''
    }`;

    onPayReceivable(payingItem.id, paymentAmountInput, note);
    setPayingItem(null);
  };

  // Open WhatsApp Modal
  const handleOpenWaReminder = (item: ReceivableItem) => {
    setWaReminderItem(item);
    setWaCopySuccess(false);
  };

  const getWaReminderText = (item: ReceivableItem) => {
    const statusNote =
      item.status === 'Lewat Tempo'
        ? '⚠️ SUDAH MELEWATI BATAS TEMPO'
        : item.status === 'Mendekati Tempo'
        ? '⏳ MENDEKATI JATUH TEMPO'
        : 'ℹ️ JADWAL TEMPO RUTIN';

    return `*PENGINGAT TAGIHAN TEMPO - JACS DEPOHUB*\n\n` +
      `Kepada Yth. Pimpinan / Kasir:\n*${item.customerName}*\n` +
      `Alamat: ${item.address}\n\n` +
      `Kami menginformasikan status nota tagihan tempo berikut:\n` +
      `• No. Invoice: *${item.id}*\n` +
      `• Total Tagihan: *Rp ${item.amount.toLocaleString('id-ID')}*\n` +
      `• Tanggal Jatuh Tempo: *${item.dueDate}*\n` +
      `• Status: *${statusNote}*\n` +
      `• Jaminan Tabung Dipinjam: *${item.gallonsLoaned} Tabung*\n\n` +
      `Pembayaran dapat ditransfer ke rekening:\n` +
      `🏦 *BCA: 8830-192-889* a.n DEPO AIR MINERAL DISTRIBUSI\n` +
      `Atau dititipkan langsung secara tunai kepada supir/kurir armada kami saat pengiriman berikutnya.\n\n` +
      `Mohon bukti transfer dikirimkan via WhatsApp ini. Terima kasih atas kerja sama yang baik! 🙏`;
  };

  const handleSendDirectWa = (item: ReceivableItem) => {
    const phone = item.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = getWaReminderText(item);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyWaText = (item: ReceivableItem) => {
    const text = getWaReminderText(item);
    navigator.clipboard.writeText(text);
    setWaCopySuccess(true);
    setTimeout(() => setWaCopySuccess(false), 2500);
  };

  return (
    <div className="h-full flex flex-col gap-2.5 overflow-hidden [body.light-theme_&]:text-slate-900">
      {/* Top Banner with Neon Strips & Badge */}
      <div className="glass-panel p-2.5 px-3.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm border-t-4 border-t-amber-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:border-amber-300 [body.light-theme_&]:text-amber-800 flex items-center justify-center text-base shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0">
            <DollarSign className="w-5 h-5 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white [body.light-theme_&]:text-slate-900 tracking-tight leading-none">
                BUKU PIUTANG & MONITORING TAGIHAN TEMPO (B2B)
              </h2>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border-amber-300">
                SINKRON DRIVER & KASIR
              </span>
            </div>
          </div>
        </div>

        {/* Action button header */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800 text-[10.5px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Driver Real-Time Sync Aktif</span>
          </div>

          {onNavigateWhatsApp && (
            <button
              onClick={onNavigateWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp font-bold text-xs"></i>
              <span>Broadcast WA Center</span>
            </button>
          )}

          {onLockSession && (
            <button
              type="button"
              onClick={onLockSession}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Kunci sesi Buku Piutang & Tempo"
            >
              <i className="fa-solid fa-lock text-xs"></i>
              <span className="hidden sm:inline">Kunci Sesi</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary / KPI Cards with Theme-Consistent Neon Border Glow on Hover */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Piutang Aktif (Neon Amber/Kuning) */}
        <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-700/60 bg-amber-950/20 [body.light-theme_&]:bg-white border-t-4 border-t-amber-500 transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Total Piutang Toko</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono my-0.5 tracking-tight drop-shadow-[0_0_8px_rgba(251,191,36,0.25)]">
            Rp {totalPiutang.toLocaleString('id-ID')}
          </div>
          <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
            Dari {receivables.length} toko/pangkalan mitra
          </div>
        </div>

        {/* Card 2: Galon Dipinjam (Neon Cyan/Biru Muda) */}
        <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-700/60 bg-cyan-950/20 [body.light-theme_&]:bg-white border-t-4 border-t-cyan-500 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Galon Dipinjam (Beredar)</span>
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono my-0.5 tracking-tight drop-shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            {totalGalonPinjam} Tabung
          </div>
          <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
            Estimasi aset: Rp {(totalGalonPinjam * 45000).toLocaleString('id-ID')}
          </div>
        </div>

        {/* Card 3: Status Lewat Tempo (Neon Merah/Rose) */}
        <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-700/60 bg-rose-950/20 [body.light-theme_&]:bg-white border-t-4 border-t-rose-500 transition-all duration-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Lewat Jatuh Tempo</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono my-0.5 tracking-tight drop-shadow-[0_0_8px_rgba(244,63,94,0.25)]">
            {countLewatTempo} Toko
          </div>
          <div className="text-[9.5px] text-rose-400 [body.light-theme_&]:text-rose-600 font-bold">
            Prioritas penagihan & blok order baru
          </div>
        </div>

        {/* Card 4: Mendekati Tempo & Aman (Neon Hijau/Emerald) */}
        <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-700/60 bg-emerald-950/20 [body.light-theme_&]:bg-white border-t-4 border-t-emerald-500 transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:-translate-y-1 cursor-default">
          <div className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Mendekati / Aman</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono my-0.5 tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.25)]">
            {countMendekatiTempo + countAman} Toko
          </div>
          <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
            {countMendekatiTempo} jatuh tempo dlm 1-2 hari
          </div>
        </div>
      </div>

      {/* Info Alert Bar with Neon Indigo Glow and Left Accent Strip */}
      <div className="p-2.5 px-3 rounded-xl bg-indigo-950/30 [body.light-theme_&]:bg-indigo-50/80 neon-border-indigo border-l-4 border-l-indigo-600 flex flex-wrap items-center justify-between gap-2 shrink-0 transition-all">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-indigo-400 [body.light-theme_&]:text-indigo-600 shrink-0" />
          <span className="font-semibold text-slate-200 [body.light-theme_&]:text-slate-800 text-[11px]">
            <strong>Koneksi Otomatis Piutang:</strong> Saat supir menerima uang titipan tagihan di{' '}
            <span className="text-cyan-400 [body.light-theme_&]:text-indigo-900 font-bold">Portal Driver</span>, status piutang toko di bawah ini langsung otomatis berkurang tanpa perlu input ulang manual.
          </span>
        </div>
        <div className="text-[10px] font-mono text-indigo-300 [body.light-theme_&]:text-indigo-800 font-bold">
          Auto-Reconciled • 4 Toko Termonitor
        </div>
      </div>

      {/* Main Table Container (Zero Outer Scroll, Internal Scroll Only) */}
      <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-2 [body.light-theme_&]:border-slate-300 flex flex-col overflow-hidden shadow-sm">
        {/* Table Filter & Search Controls */}
        <div className="p-2 px-3 border-b border-slate-800 [body.light-theme_&]:border-slate-200 bg-slate-950/60 [body.light-theme_&]:bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase mr-1">
              Filter:
            </span>
            {(['Semua', 'BELUM LUNAS', 'Lewat Tempo', 'Mendekati Tempo', 'LUNAS', 'Aman'] as const).map((filter) => {
              const isActive = selectedFilter === filter;
              const count =
                filter === 'Semua'
                  ? receivables.length
                  : filter === 'LUNAS'
                  ? receivables.filter((r) => r.status === 'LUNAS' || r.amount === 0).length
                  : receivables.filter((r) => r.status === filter).length;

              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                      : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900 bg-slate-900/60 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-200'
                  }`}
                >
                  <span>{filter}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Cari toko, invoice, atau no HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 text-slate-200 [body.light-theme_&]:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100 border-b-2 border-slate-800 [body.light-theme_&]:border-slate-300 backdrop-blur-md z-10">
              <tr className="text-[10px] font-extrabold text-slate-400 [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                <th className="py-2 px-3">No. Faktur / ID & Tanggal</th>
                <th className="py-2 px-3">Nama Toko & Kontak</th>
                <th className="py-2 px-3 text-right">Nominal Tagihan</th>
                <th className="py-2 px-3 text-center">Galon Dipinjam</th>
                <th className="py-2 px-3">Jatuh Tempo</th>
                <th className="py-2 px-3 text-center">Status Piutang</th>
                <th className="py-2 px-3 text-center">Aksi Pelunasan & WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 [body.light-theme_&]:text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold">Tidak ada daftar tagihan tempo yang cocok</p>
                    <p className="text-[10px] mt-0.5">Semua toko berstatus lunas atau filter tidak menemukan hasil</p>
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((item) => {
                  const isLunas = item.status === 'LUNAS' || item.amount === 0;
                  const isBelumLunas = item.status === 'BELUM LUNAS';
                  const isOverdue = item.status === 'Lewat Tempo';
                  const isApproaching = item.status === 'Mendekati Tempo';

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-all duration-300 border-l-[4px] border-y border-transparent cursor-pointer ${
                        isLunas
                          ? 'border-l-emerald-400 bg-emerald-950/10 [body.light-theme_&]:bg-emerald-50/20 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-950/25'
                          : isOverdue
                          ? 'border-l-rose-500 bg-rose-950/10 [body.light-theme_&]:bg-rose-50/30 hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:bg-rose-950/25'
                          : isApproaching || isBelumLunas
                          ? 'border-l-amber-500 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.35)] hover:bg-amber-950/20'
                          : 'border-l-cyan-500 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:bg-cyan-950/20'
                      }`}
                    >
                      {/* Invoice & Tanggal Transaksi */}
                      <td className="py-2 px-3">
                        <div className="font-mono font-bold text-cyan-400 [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{item.id}</span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span>Tgl: {item.transactionDate || '29 Sep 2026'}</span>
                        </div>
                        <span className="text-[8.5px] text-slate-500 font-mono block">
                          Termin Tempo 7 Hari
                        </span>
                      </td>

                      {/* Store Details */}
                      <td className="py-2 px-3">
                        <div className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.customerName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-xs">{item.address}</span>
                          <span>•</span>
                          <span className="font-mono text-cyan-400 [body.light-theme_&]:text-indigo-700">{item.phone}</span>
                        </div>
                      </td>

                      {/* Nilai Tagihan (Bold high contrast) */}
                      <td className="py-2 px-3 text-right">
                        <div className={`font-mono font-black text-sm ${isLunas ? 'text-emerald-400 [body.light-theme_&]:text-emerald-700' : 'text-amber-300 [body.light-theme_&]:text-slate-900'}`}>
                          Rp {item.amount.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600 font-medium">
                          {isLunas ? '✅ Lunas dibukukan' : 'Belum terbayar'}
                        </span>
                      </td>

                      {/* Jumlah Galon Dipinjam */}
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 [body.light-theme_&]:bg-violet-100 [body.light-theme_&]:text-violet-900 [body.light-theme_&]:border-violet-300">
                          <RotateCw className="w-2.5 h-2.5" />
                          {item.gallonsLoaned} Tabung
                        </span>
                      </td>

                      {/* Jatuh Tempo */}
                      <td className="py-2 px-3">
                        <div className="font-mono text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-900 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.dueDate}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 [body.light-theme_&]:text-slate-600">
                          {isLunas ? 'Lunas sebelum tempo' : isOverdue ? '⚠️ Terlambat lewat batas' : isApproaching ? 'Jatuh tempo segera' : 'Default 7 hari'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2 px-3 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-400 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>LUNAS</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-900 [body.light-theme_&]:border-rose-400 shadow-sm animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-400 [body.light-theme_&]:text-rose-700" />
                            <span>LEWAT TEMPO</span>
                          </span>
                        ) : isApproaching ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border-amber-400 shadow-sm">
                            <Clock className="w-3 h-3 text-amber-400 [body.light-theme_&]:text-amber-700" />
                            <span>MENDEKATI TEMPO</span>
                          </span>
                        ) : isBelumLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-950 shadow-sm">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>BELUM LUNAS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-900 [body.light-theme_&]:border-cyan-400 shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-cyan-400 [body.light-theme_&]:text-cyan-700" />
                            <span>AMAN</span>
                          </span>
                        )}
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol [ Pelunasan ] */}
                          {isLunas ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black text-emerald-400 [body.light-theme_&]:text-emerald-800 bg-emerald-950/40 [body.light-theme_&]:bg-emerald-100 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Lunas Terbuku</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(item)}
                              className="px-2.5 py-1 rounded-lg text-[10.5px] font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.35)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Klik untuk proses Pelunasan & Sinkronkan Kas Masuk Harian"
                            >
                              <DollarSign className="w-3 h-3 stroke-[3]" />
                              <span>Pelunasan</span>
                            </button>
                          )}

                          {/* Tombol Cepat: Kirim Pengingat WA */}
                          <button
                            type="button"
                            onClick={() => handleOpenWaReminder(item)}
                            className="px-2 py-1 rounded-lg text-[10.5px] font-bold text-emerald-300 [body.light-theme_&]:text-emerald-800 bg-emerald-950/50 [body.light-theme_&]:bg-emerald-50 border border-emerald-500/40 hover:bg-emerald-900/60 [body.light-theme_&]:hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Kirim Nota Pengingat WhatsApp"
                          >
                            <i className="fa-brands fa-whatsapp text-xs font-bold text-emerald-400"></i>
                            <span className="hidden sm:inline">Kirim WA</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Statistics */}
        <div className="p-2 px-3 border-t border-slate-800 [body.light-theme_&]:border-slate-200 bg-slate-950/80 [body.light-theme_&]:bg-slate-100 text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            Menampilkan <strong>{filteredReceivables.length}</strong> dari <strong>{receivables.length}</strong> toko tempo aktif
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>
              Total Nilai Tagihan: <strong className="text-amber-400 [body.light-theme_&]:text-slate-900">Rp {totalPiutang.toLocaleString('id-ID')}</strong>
            </span>
            <span>•</span>
            <span>
              Total Tabung Tertahan: <strong className="text-cyan-400 [body.light-theme_&]:text-slate-900">{totalGalonPinjam} Galon</strong>
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: PROSES PELUNASAN PIUTANG */}
      {payingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 flex items-center justify-center text-sm font-black border border-emerald-400/40">
                  <DollarSign className="w-4 h-4 font-black" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white [body.light-theme_&]:text-slate-900">
                    PELUNASAN PIUTANG TOKO
                  </h3>
                  <span className="text-[10px] text-cyan-400 [body.light-theme_&]:text-indigo-700 font-bold font-mono">
                    {payingItem.customerName} (#{payingItem.id})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPayingItem(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 text-xs">
              {/* Box Info Tagihan */}
              <div className="p-3 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 block">Sisa Tagihan Tempo:</span>
                  <div className="text-base font-black text-amber-400 [body.light-theme_&]:text-slate-900 font-mono">
                    Rp {payingItem.amount.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-600 block">Jaminan Galon Dipinjam:</span>
                  <div className="text-base font-black text-cyan-400 [body.light-theme_&]:text-slate-900 font-mono">
                    {payingItem.gallonsLoaned} Tabung
                  </div>
                </div>
              </div>

              {/* Input Nominal Pembayaran */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-200 [body.light-theme_&]:text-slate-800 block">
                  Nominal Pembayaran Diterima (Rp): *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={paymentAmountInput || ''}
                    onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 text-sm font-black font-mono rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border-2 border-slate-700 [body.light-theme_&]:border-slate-300 text-emerald-400 [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-emerald-400"
                    placeholder="Masukkan nominal bayar..."
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentAmountInput(payingItem.amount)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 border border-emerald-400/40 cursor-pointer"
                  >
                    Lunas Penuh (Rp {payingItem.amount.toLocaleString('id-ID')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmountInput(Math.round(payingItem.amount / 2))}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 [body.light-theme_&]:bg-slate-100 text-slate-300 [body.light-theme_&]:text-slate-700 border border-slate-700 [body.light-theme_&]:border-slate-300 cursor-pointer"
                  >
                    Bayar 50%
                  </button>
                </div>
              </div>

              {/* Metode Pembayaran & Jalur Setoran */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Tunai Depo">Tunai di Depo (Kasir)</option>
                    <option value="Transfer Bank">Transfer Bank (BCA / Mandiri)</option>
                    <option value="Titipan Supir">Titipan Setoran Supir / Viar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block">
                    Petugas Penerima:
                  </label>
                  <select
                    value={paymentCollector}
                    onChange={(e) => setPaymentCollector(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Kasir Depo">Kasir Depo (Siti Aminah)</option>
                    <option value="Pak Bambang Sukoco (Carry)">Pak Bambang Sukoco (Carry B 9421 KDA)</option>
                    <option value="Rian Prasetyo (Gran Max)">Rian Prasetyo (Gran Max B 9104 UCN)</option>
                    <option value="Rudi Hartono (Viar Karya)">Rudi Hartono (Viar Karya B 6124 KRO)</option>
                    <option value="Hendra Gunawan (Mega Carry)">Hendra Gunawan (Mega Carry B 9872 ZAF)</option>
                  </select>
                </div>
              </div>

              {/* Pengembalian Tabung Kosong Dipinjam */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-bold text-slate-200 [body.light-theme_&]:text-slate-800">
                    Pengembalian Tabung Galon Pinjam (Jika Ada):
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Maks: {payingItem.gallonsLoaned} Tabung
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={payingItem.gallonsLoaned}
                    value={returnedGallonsPayment}
                    onChange={(e) => setReturnedGallonsPayment(Number(e.target.value))}
                    className="flex-1 accent-emerald-400"
                  />
                  <span className="w-16 text-center font-mono font-black text-cyan-400 [body.light-theme_&]:text-slate-900 bg-slate-900 [body.light-theme_&]:bg-white px-2 py-0.5 rounded border border-slate-700 [body.light-theme_&]:border-slate-300 text-xs">
                    {returnedGallonsPayment} Tbg
                  </span>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block">
                  Keterangan Bukti Bayar / Referensi:
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Misal: No. Ref Transfer 129038290 / Diterima tunai amplop"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2.5 border-t border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 text-slate-950 font-black text-xs shadow-[0_0_14px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 font-black" />
                <span>Simpan Pelunasan (Rp {paymentAmountInput.toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KIRIM PENGINGAT WHATSAPP TAGIHAN */}
      {waReminderItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 [body.light-theme_&]:bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 flex items-center justify-center text-sm font-black border border-emerald-500/40">
                  <i className="fa-brands fa-whatsapp text-lg font-bold"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white [body.light-theme_&]:text-slate-900">
                    KIRIM PENGINGAT WHATSAPP TAGIHAN
                  </h3>
                  <span className="text-[10px] text-emerald-400 [body.light-theme_&]:text-emerald-800 font-bold">
                    {waReminderItem.customerName} ({waReminderItem.phone})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setWaReminderItem(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Preview */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700">
                Pratinjau Pesan Penagihan Resmi:
              </div>
              <div className="p-3 rounded-xl bg-slate-950/90 [body.light-theme_&]:bg-slate-50 border border-emerald-500/30 font-mono text-[11px] leading-relaxed text-slate-200 [body.light-theme_&]:text-slate-800 whitespace-pre-wrap select-all">
                {getWaReminderText(waReminderItem)}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2.5 border-t border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyWaText(waReminderItem)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-200 [body.light-theme_&]:text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {waCopySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Salin Teks Pesan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSendDirectWa(waReminderItem)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_14px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <i className="fa-brands fa-whatsapp text-sm font-bold"></i>
                <span>Buka WhatsApp Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
