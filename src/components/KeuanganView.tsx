import React, { useState } from 'react';
import { RECEIVABLES } from '../data/mockData';
import { ReceivableItem } from '../types';

interface KeuanganViewProps {
  mode: 'kasir' | 'piutang';
  onNavigateWhatsApp: () => void;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({ mode, onNavigateWhatsApp }) => {
  const [receivables, setReceivables] = useState<ReceivableItem[]>(RECEIVABLES);

  const handlePay = (id: string) => {
    setReceivables(receivables.filter((r) => r.id !== id));
    alert(`Pembayaran untuk invoice ${id} berhasil dicatat dan lunas.`);
  };

  const totalPiutang = receivables.reduce((sum, r) => sum + r.amount, 0);
  const totalGalonPinjam = receivables.reduce((sum, r) => sum + r.gallonsLoaned, 0);

  return (
    <div className="h-full flex flex-col gap-2.5 overflow-hidden [body.light-theme_&]:text-slate-800">
      {/* Header Banner - Compact */}
      <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
            <span
              className={`w-2 h-2 rounded-full ${
                mode === 'kasir' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            {mode === 'kasir' ? 'Kasir & Pelunasan Nota Harian' : 'Buku Piutang & Tagihan Tempo'}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <i className="fa-brands fa-whatsapp font-bold text-xs"></i>
            Kirim Tagihan WA
          </button>
        </div>
      </div>

      {/* Summary Cards - Compact Proportions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
        <div className="glass-panel p-2.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 shadow-sm">
          <div className="text-[10.5px] font-bold text-slate-400 [body.light-theme_&]:text-slate-500 uppercase tracking-wide">
            {mode === 'kasir' ? 'Total Kas Masuk Hari Ini' : 'Total Piutang Tertagih'}
          </div>
          <div className="text-xl font-extrabold text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono my-0.5">
            {mode === 'kasir' ? 'Rp 450.000' : `Rp ${totalPiutang.toLocaleString('id-ID')}`}
          </div>
          <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500">
            {mode === 'kasir' ? '1 Transaksi Selesai' : `${receivables.length} Toko Langganan`}
          </div>
        </div>

        <div className="glass-panel p-2.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 shadow-sm">
          <div className="text-[10.5px] font-bold text-slate-400 [body.light-theme_&]:text-slate-500 uppercase tracking-wide">
            {mode === 'kasir' ? 'Setoran Tunai Fisik di Brankas' : 'Galon Dipinjam (Beredar)'}
          </div>
          <div className="text-xl font-extrabold text-white [body.light-theme_&]:text-slate-900 font-mono my-0.5">
            {mode === 'kasir' ? 'Rp 450.000' : `${totalGalonPinjam} Tabung`}
          </div>
          <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500">
            {mode === 'kasir' ? 'Transfer Bank / QRIS: Rp 0' : 'Jaminan Tabung Belum Kembali'}
          </div>
        </div>

        <div className="glass-panel p-2.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 shadow-sm">
          <div className="text-[10.5px] font-bold text-slate-400 [body.light-theme_&]:text-slate-500 uppercase tracking-wide">Status Jatuh Tempo</div>
          <div className="text-xl font-extrabold text-amber-400 [body.light-theme_&]:text-amber-700 font-mono my-0.5">
            {receivables.filter((r) => r.status === 'Lewat Tempo').length} Toko
          </div>
          <div className="text-[9.5px] text-rose-400 [body.light-theme_&]:text-rose-600 font-semibold">
            Perlu tindak lanjut penagihan hari ini
          </div>
        </div>
      </div>

      {/* Receivables / Cash Records Table (Internal Scroll Only) */}
      <div className="flex-1 min-h-0 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-2 px-3 border-b border-slate-800 [body.light-theme_&]:border-slate-200 font-bold text-xs text-white [body.light-theme_&]:text-slate-900 flex items-center justify-between shrink-0">
          <span>Daftar Tagihan & Pelunasan Toko Langganan</span>
          <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">Termin Tempo Standar: 7 - 14 Hari</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900/95 [body.light-theme_&]:bg-slate-100/95 backdrop-blur-md z-10">
              <tr className="border-b border-slate-800 [body.light-theme_&]:border-slate-200 text-[10px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600 uppercase tracking-wider">
                <th className="py-1.5 px-3">No. Invoice</th>
                <th className="py-1.5 px-3">Nama Pangkalan / Toko</th>
                <th className="py-1.5 px-3">Total Tagihan</th>
                <th className="py-1.5 px-3">Pinjaman Galon</th>
                <th className="py-1.5 px-3">Jatuh Tempo</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-3 text-center">Aksi Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200">
              {receivables.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50 [body.light-theme_&]:hover:bg-slate-50 transition-colors">
                  <td className="py-1.5 px-3 font-mono font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700 text-[11px]">{item.id}</td>
                  <td className="py-1.5 px-3">
                    <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs">{item.customerName}</div>
                    <div className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-500">{item.address} • {item.phone}</div>
                  </td>
                  <td className="py-1.5 px-3 font-mono font-extrabold text-slate-100 [body.light-theme_&]:text-slate-900 text-xs">
                    Rp {item.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-1.5 px-3 font-mono font-bold text-violet-300 [body.light-theme_&]:text-violet-700 text-[11px]">
                    {item.gallonsLoaned} Tabung
                  </td>
                  <td className="py-1.5 px-3 font-mono text-slate-300 [body.light-theme_&]:text-slate-700 text-[11px]">
                    {item.dueDate}
                  </td>
                  <td className="py-1.5 px-3">
                    {item.status === 'Lewat Tempo' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 [body.light-theme_&]:text-rose-700 [body.light-theme_&]:bg-rose-50 border border-rose-500/30 [body.light-theme_&]:border-rose-300">
                        <i className="fa-solid fa-triangle-exclamation text-[8px]"></i> Lewat
                      </span>
                    ) : item.status === 'Mendekati Tempo' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:bg-amber-50 border border-amber-500/30 [body.light-theme_&]:border-amber-300">
                        <i className="fa-solid fa-clock text-[8px]"></i> Tempo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:bg-emerald-50 border border-emerald-500/30 [body.light-theme_&]:border-emerald-300">
                        <i className="fa-solid fa-shield-check text-[8px]"></i> Aman
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handlePay(item.id)}
                        className="px-2.5 py-0.5 rounded text-[10px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 cursor-pointer shadow-sm"
                      >
                        Lunas
                      </button>
                      <button
                        onClick={onNavigateWhatsApp}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 cursor-pointer"
                        title="Kirim Nota via WA"
                      >
                        <i className="fa-brands fa-whatsapp text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
