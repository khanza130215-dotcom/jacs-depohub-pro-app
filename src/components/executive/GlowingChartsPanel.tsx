import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Boxes,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface GlowingChartsPanelProps {
  grossRevenue: number;
  totalHpp: number;
  pettyCashCost: number;
  netProfit: number;
  assetStats: {
    total: number;
    filled: number;
    emptyInDepo: number;
    loanedToStores: number;
    damaged: number;
    estimatedLossRp: number;
  };
}

export const GlowingChartsPanel: React.FC<GlowingChartsPanelProps> = ({
  grossRevenue,
  totalHpp,
  pettyCashCost,
  netProfit,
  assetStats,
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Multiplier for periods
  const mult = period === 'today' ? 1 : period === 'week' ? 6.8 : 28.5;

  const currentRevenue = Math.round(grossRevenue * mult);
  const currentHpp = Math.round(totalHpp * mult);
  const currentPettyCash = Math.round(pettyCashCost * mult);
  const currentNetProfit = Math.round(netProfit * mult);

  const maxVal = Math.max(currentRevenue, currentHpp, currentPettyCash, currentNetProfit, 1);

  // Asset circulation percentages
  const totalAssets = Math.max(assetStats.total, 1);
  const filledPct = Math.round((assetStats.filled / totalAssets) * 100);
  const emptyPct = Math.round((assetStats.emptyInDepo / totalAssets) * 100);
  const loanedPct = Math.round((assetStats.loanedToStores / totalAssets) * 100);
  const damagedPct = Math.max(1, Math.round((assetStats.damaged / totalAssets) * 100));

  return (
    <div className="space-y-4">
      {/* 4 Neon Highlight KPI Cards with Hover Glow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Omzet Penjualan (Cyan Neon) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-cyan-500 group cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-black tracking-wider block">
              Omzet Penjualan (Bruto)
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse"></div>
          </div>
          <span className="text-base sm:text-xl font-black text-cyan-800 dark:text-cyan-400 font-mono block mt-1">
            Rp {currentRevenue.toLocaleString('id-ID')}
          </span>
          <span className="text-[10.5px] text-cyan-900 dark:text-cyan-300 font-bold block mt-0.5">
            Baseline Pendapatan 100%
          </span>
        </div>

        {/* Beban Pokok HPP (Amber Neon) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-amber-500 group cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-black tracking-wider block">
              Beban Pokok (HPP Pabrik)
            </span>
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></div>
          </div>
          <span className="text-base sm:text-xl font-black text-amber-800 dark:text-amber-400 font-mono block mt-1">
            Rp {currentHpp.toLocaleString('id-ID')}
          </span>
          <span className="text-[10.5px] text-amber-900 dark:text-amber-300 font-bold block mt-0.5">
            {currentRevenue > 0 ? Math.round((currentHpp / currentRevenue) * 100) : 0}% Terhadap Omzet
          </span>
        </div>

        {/* Beban Kas Kecil (Rose Neon) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-rose-500 group cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-black tracking-wider block">
              Beban Kas Kecil Operasional
            </span>
            <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]"></div>
          </div>
          <span className="text-base sm:text-xl font-black text-rose-800 dark:text-rose-400 font-mono block mt-1">
            Rp {currentPettyCash.toLocaleString('id-ID')}
          </span>
          <span className="text-[10.5px] text-rose-900 dark:text-rose-300 font-bold block mt-0.5">
            BBM, Makan Supir, Maintenance
          </span>
        </div>

        {/* Laba Bersih (Emerald Neon) */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-emerald-500 group cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-black tracking-wider block">
              Laba Bersih Operasional
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-ping"></div>
          </div>
          <span className="text-base sm:text-xl font-black text-emerald-800 dark:text-emerald-400 font-mono block mt-1">
            Rp {currentNetProfit.toLocaleString('id-ID')}
          </span>
          <span className="text-[10.5px] text-emerald-900 dark:text-emerald-300 font-bold block mt-0.5">
            Net Margin: {currentRevenue > 0 ? Math.round((currentNetProfit / currentRevenue) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* PANEL 1: GRAFIK BATANG (BAR CHART) KOMPARASI DENGAN BORDER MENYALA */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_28px_rgba(6,182,212,0.35)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-cyan-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Grafik Komparasi Finansial: Omzet vs HPP vs Kas Kecil vs Laba</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-500/30">
                  NEON CHART
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                Visualisasi rasio serapan beban operasional terhadap omzet kotor penjualan
              </p>
            </div>
          </div>

          {/* Interactive Period Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                period === 'today'
                  ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                period === 'week'
                  ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
              }`}
            >
              7 Hari Berjalan
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
              }`}
            >
              Proyeksi 30 Hari
            </button>
          </div>
        </div>

        {/* Visual Vertical Bar Chart with Glowing Neon Effect */}
        <div className="p-4 rounded-xl bg-slate-950/60 [body.light-theme_&]:bg-slate-50 border border-slate-800/80 [body.light-theme_&]:border-slate-200">
          <div className="grid grid-cols-4 gap-3 sm:gap-6 h-56 sm:h-64 items-end pt-8 pb-3 px-2">
            {/* Bar 1: Omzet Penjualan (Cyan) */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-[10px] sm:text-xs font-mono font-black text-cyan-400 mb-1.5 text-center group-hover:scale-105 transition-transform">
                Rp {currentRevenue.toLocaleString('id-ID')}
              </span>
              <div className="w-full max-w-[64px] bg-slate-900 [body.light-theme_&]:bg-slate-200 rounded-t-xl overflow-hidden flex items-end h-full p-0.5 border border-transparent group-hover:border-cyan-400/60 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                <div
                  style={{ height: `${Math.max(12, Math.round((currentRevenue / maxVal) * 100))}%` }}
                  className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-xl border-t-2 border-x border-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_28px_rgba(6,182,212,0.9)] transition-all duration-500 relative flex items-center justify-center"
                >
                  <span className="text-[9px] font-mono font-bold text-white drop-shadow">100%</span>
                </div>
              </div>
              <span className="text-[10.5px] font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 mt-2 text-center group-hover:text-cyan-300">
                Omzet Penjualan
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block">Kotor Semua Item</span>
            </div>

            {/* Bar 2: HPP Pokok (Amber) */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-[10px] sm:text-xs font-mono font-black text-amber-400 mb-1.5 text-center group-hover:scale-105 transition-transform">
                Rp {currentHpp.toLocaleString('id-ID')}
              </span>
              <div className="w-full max-w-[64px] bg-slate-900 [body.light-theme_&]:bg-slate-200 rounded-t-xl overflow-hidden flex items-end h-full p-0.5 border border-transparent group-hover:border-amber-400/60 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all">
                <div
                  style={{ height: `${Math.max(10, Math.round((currentHpp / maxVal) * 100))}%` }}
                  className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl border-t-2 border-x border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.5)] group-hover:shadow-[0_0_28px_rgba(245,158,11,0.9)] transition-all duration-500 relative flex items-center justify-center"
                >
                  <span className="text-[9px] font-mono font-bold text-slate-950 drop-shadow">
                    {currentRevenue > 0 ? Math.round((currentHpp / currentRevenue) * 100) : 0}%
                  </span>
                </div>
              </div>
              <span className="text-[10.5px] font-black text-amber-400 [body.light-theme_&]:text-amber-700 mt-2 text-center group-hover:text-amber-300">
                Beban Pokok (HPP)
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block">Tebus Pabrik</span>
            </div>

            {/* Bar 3: Beban Kas Kecil (Rose) */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-[10px] sm:text-xs font-mono font-black text-rose-400 mb-1.5 text-center group-hover:scale-105 transition-transform">
                Rp {currentPettyCash.toLocaleString('id-ID')}
              </span>
              <div className="w-full max-w-[64px] bg-slate-900 [body.light-theme_&]:bg-slate-200 rounded-t-xl overflow-hidden flex items-end h-full p-0.5 border border-transparent group-hover:border-rose-400/60 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all">
                <div
                  style={{ height: `${Math.max(8, Math.round((currentPettyCash / maxVal) * 100))}%` }}
                  className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl border-t-2 border-x border-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.5)] group-hover:shadow-[0_0_28px_rgba(244,63,94,0.9)] transition-all duration-500 relative flex items-center justify-center"
                >
                  <span className="text-[9px] font-mono font-bold text-white drop-shadow">
                    {currentRevenue > 0 ? Math.round((currentPettyCash / currentRevenue) * 100) : 0}%
                  </span>
                </div>
              </div>
              <span className="text-[10.5px] font-black text-rose-400 [body.light-theme_&]:text-rose-700 mt-2 text-center group-hover:text-rose-300">
                Beban Kas Kecil
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block">BBM & Opex Depo</span>
            </div>

            {/* Bar 4: Laba Bersih (Emerald) */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-[10px] sm:text-xs font-mono font-black text-emerald-400 mb-1.5 text-center group-hover:scale-105 transition-transform">
                Rp {currentNetProfit.toLocaleString('id-ID')}
              </span>
              <div className="w-full max-w-[64px] bg-slate-900 [body.light-theme_&]:bg-slate-200 rounded-t-xl overflow-hidden flex items-end h-full p-0.5 border border-transparent group-hover:border-emerald-400/60 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">
                <div
                  style={{ height: `${Math.max(10, Math.round((currentNetProfit / maxVal) * 100))}%` }}
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl border-t-2 border-x border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.6)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.95)] transition-all duration-500 relative flex items-center justify-center"
                >
                  <span className="text-[9px] font-mono font-bold text-white drop-shadow">
                    {currentRevenue > 0 ? Math.round((currentNetProfit / currentRevenue) * 100) : 0}%
                  </span>
                </div>
              </div>
              <span className="text-[10.5px] font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 mt-2 text-center group-hover:text-emerald-300">
                Laba Bersih
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block">Net Margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 2: GRAFIK SIRKULASI ASET (PROGRESS BAR & RATIO) DENGAN EFEK BORDER MENYALA */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_28px_rgba(16,185,129,0.35)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2">
                <span>Grafik Sirkulasi Aset Tabung Galon (Ratio & Progress Bar)</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  REAL-TIME RATIO
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                Total Populasi: <strong className="text-white [body.light-theme_&]:text-slate-900">{assetStats.total} Tabung</strong> (Aqua, Le Minerale, Cleo, Vit)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            Sirkulasi Sehat: {filledPct + loanedPct}% Aktif
          </span>
        </div>

        {/* Multi-Segmented Glowing Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-5 rounded-xl bg-slate-950 border border-slate-700/80 overflow-hidden flex p-0.5 shadow-inner">
            {/* Terisi (Emerald) */}
            <div
              style={{ width: `${filledPct}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-lg shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all duration-500"
              title={`Tabung Terisi: ${assetStats.filled} (${filledPct}%)`}
            ></div>
            {/* Kosong di Depo (Cyan) */}
            <div
              style={{ width: `${emptyPct}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_12px_rgba(6,182,212,0.7)] transition-all duration-500"
              title={`Tabung Kosong di Depo: ${assetStats.emptyInDepo} (${emptyPct}%)`}
            ></div>
            {/* Beredar di Toko (Amber) */}
            <div
              style={{ width: `${loanedPct}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.7)] transition-all duration-500"
              title={`Beredar di Toko / Pelanggan: ${assetStats.loanedToStores} (${loanedPct}%)`}
            ></div>
            {/* Hilang / Rusak (Rose) */}
            <div
              style={{ width: `${damagedPct}%` }}
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-r-lg shadow-[0_0_12px_rgba(244,63,94,0.7)] transition-all duration-500"
              title={`Hilang / Rusak: ${assetStats.damaged} (${damagedPct}%)`}
            ></div>
          </div>

          {/* 4 Cards Status Sirkulasi dengan Border Menyala on Hover */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {/* Tabung Terisi */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-emerald-500 cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-emerald-400">1. Tabung Terisi</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  {filledPct}%
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-white [body.light-theme_&]:text-slate-900 font-mono block mt-1">
                {assetStats.filled} Tabung
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                Siaga di gudang siap kirim
              </span>
            </div>

            {/* Tabung Kosong di Depo */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-cyan-500 cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-cyan-400">2. Kosong di Depo</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                  {emptyPct}%
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-white [body.light-theme_&]:text-slate-900 font-mono block mt-1">
                {assetStats.emptyInDepo} Tabung
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                Siap tukar guling ke pabrik
              </span>
            </div>

            {/* Tabung Beredar di Toko */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-amber-500 cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-amber-400">3. Beredar di Toko</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                  {loanedPct}%
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-white [body.light-theme_&]:text-slate-900 font-mono block mt-1">
                {assetStats.loanedToStores} Tabung
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                Dipinjamkan / jaminan toko
              </span>
            </div>

            {/* Tabung Hilang / Rusak */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 shadow-sm transition-all duration-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] hover:-translate-y-1 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:hover:border-rose-500 cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-rose-400">4. Hilang / Rusak</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                  {damagedPct}%
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-rose-400 [body.light-theme_&]:text-rose-600 font-mono block mt-1">
                {assetStats.damaged} Tabung
              </span>
              <span className="text-[9.5px] text-rose-500 font-bold block mt-0.5">
                Rugi: Rp {assetStats.estimatedLossRp.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
