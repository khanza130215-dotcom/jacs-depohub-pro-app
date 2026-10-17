import React, { useState } from 'react';
import { PettyCashItem, PettyCashCategory } from '../../types';
import {
  Wallet,
  Plus,
  Check,
  X,
  Fuel,
  Utensils,
  Sparkles,
  Wrench,
  Boxes,
  HelpCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface PettyCashPanelProps {
  pettyCashList: PettyCashItem[];
  plafon: number;
  onUpdatePettyCash: (items: PettyCashItem[]) => void;
  onUpdatePlafon: (newPlafon: number) => void;
}

export const PettyCashPanel: React.FC<PettyCashPanelProps> = ({
  pettyCashList,
  plafon,
  onUpdatePettyCash,
  onUpdatePlafon,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isEditingPlafon, setIsEditingPlafon] = useState(false);
  const [plafonInput, setPlafonInput] = useState(plafon.toString());

  // Form state
  const [formCategory, setFormCategory] = useState<PettyCashCategory>('BBM Armada');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formRecipient, setFormRecipient] = useState<string>('');

  const approvedTotal = pettyCashList
    .filter((it) => it.status === 'DISETUJUI')
    .reduce((s, it) => s + (it.amount || 0), 0);

  const pendingTotal = pettyCashList
    .filter((it) => it.status === 'MENUNGGU_PERSETUJUAN')
    .reduce((s, it) => s + (it.amount || 0), 0);

  const remainingBalance = Math.max(0, plafon - approvedTotal);

  const handleSavePlafon = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(plafonInput.replace(/\D/g, ''));
    if (val > 0) {
      onUpdatePlafon(val);
      setIsEditingPlafon(false);
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = Number(formAmount.replace(/\D/g, ''));
    if (!nominal || !formDesc.trim() || !formRecipient.trim()) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = `${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    const newItem: PettyCashItem = {
      id: `KAS-${Date.now().toString().slice(-4)}`,
      date: dateStr,
      time: timeStr,
      category: formCategory,
      amount: nominal,
      description: formDesc.trim(),
      recipientName: formRecipient.trim(),
      status: 'MENUNGGU_PERSETUJUAN',
    };

    onUpdatePettyCash([newItem, ...pettyCashList]);
    setFormAmount('');
    setFormDesc('');
    setFormRecipient('');
  };

  const handleApprove = (id: string) => {
    const now = new Date();
    const timeStr = `${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    const updated = pettyCashList.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'DISETUJUI' as const,
            approvedBy: 'Executive Manager',
            approvedAt: timeStr,
          }
        : item
    );
    onUpdatePettyCash(updated);
  };

  const handleReject = (id: string) => {
    const updated = pettyCashList.map((item) =>
      item.id === id ? { ...item, status: 'DITOLAK' as const } : item
    );
    onUpdatePettyCash(updated);
  };

  const getCategoryIcon = (cat: PettyCashCategory) => {
    switch (cat) {
      case 'BBM Armada':
        return <Fuel className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Uang Makan / Jalan Supir':
        return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'Pembelian Tisu / Segel Galon':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Tambal Ban & Servis Ringan':
        return <Wrench className="w-3.5 h-3.5 text-rose-400" />;
      case 'Maintenance Mesin Cuci / Filter':
        return <Boxes className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredItems = pettyCashList.filter((item) => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* 4 Glowing Metric Cards Kas Kecil */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Plafon Kas Kecil */}
        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-cyan-400">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Plafon Kas Kecil</span>
            <button
              onClick={() => {
                setPlafonInput(plafon.toString());
                setIsEditingPlafon(!isEditingPlafon);
              }}
              className="text-[10px] text-cyan-400 hover:underline cursor-pointer font-mono font-bold"
            >
              {isEditingPlafon ? 'Batal' : 'Ubah Plafon'}
            </button>
          </div>
          {isEditingPlafon ? (
            <form onSubmit={handleSavePlafon} className="mt-1 flex items-center gap-1.5">
              <input
                type="number"
                value={plafonInput}
                onChange={(e) => setPlafonInput(e.target.value)}
                className="w-full text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] rounded font-bold cursor-pointer"
              >
                Simpan
              </button>
            </form>
          ) : (
            <span className="text-base sm:text-lg font-black text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono block mt-0.5">
              Rp {plafon.toLocaleString('id-ID')}
            </span>
          )}
          <span className="text-[10px] text-slate-500 block mt-0.5">Alokasi Kas Fisik Harian</span>
        </div>

        {/* Realisasi Pengeluaran */}
        <div className="glass-panel p-3.5 rounded-xl border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-400">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Realisasi Terpotong</span>
          <span className="text-base sm:text-lg font-black text-rose-400 [body.light-theme_&]:text-rose-700 font-mono block mt-0.5">
            Rp {approvedTotal.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-rose-500/90 font-bold block mt-0.5">
            {pettyCashList.filter((it) => it.status === 'DISETUJUI').length} Pengeluaran Disetujui
          </span>
        </div>

        {/* Sisa Kas Kecil Otomatis */}
        <div className="glass-panel p-3.5 rounded-xl border-2 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-500">
          <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">Sisa Kas Fisik Depo</span>
          <span className="text-base sm:text-lg font-black text-emerald-400 [body.light-theme_&]:text-emerald-700 font-mono block mt-0.5">
            Rp {remainingBalance.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">
            Tersedia di Brankas Kasir
          </span>
        </div>

        {/* Menunggu Persetujuan */}
        <div className="glass-panel p-3.5 rounded-xl border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-amber-400">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Menunggu Otorisasi</span>
          <span className="text-base sm:text-lg font-black text-amber-400 [body.light-theme_&]:text-amber-700 font-mono block mt-0.5">
            Rp {pendingTotal.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-amber-500 font-bold block mt-0.5">
            {pettyCashList.filter((it) => it.status === 'MENUNGGU_PERSETUJUAN').length} Menunggu Persetujuan
          </span>
        </div>
      </div>

      {/* Form Input Cepat Beban Kas Kecil */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all [body.light-theme_&]:bg-white [body.light-theme_&]:border-emerald-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 [body.light-theme_&]:border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white [body.light-theme_&]:text-slate-900">
                Pencatatan Cepat Pengeluaran Kas Kecil Operasional
              </h3>
              <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                Input pengeluaran BBM, makan supir, tisu segel galon, dan maintenance depo
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            OTORISASI CEPAT
          </span>
        </div>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
              Kategori Beban:
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as PettyCashCategory)}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900 font-sans"
            >
              <option value="BBM Armada">BBM Armada</option>
              <option value="Uang Makan / Jalan Supir">Uang Makan / Jalan Supir</option>
              <option value="Pembelian Tisu / Segel Galon">Pembelian Tisu / Segel Galon</option>
              <option value="Tambal Ban & Servis Ringan">Tambal Ban & Servis Ringan</option>
              <option value="Maintenance Mesin Cuci / Filter">Maintenance Mesin Cuci / Filter</option>
              <option value="Operasional Depo Lainnya">Operasional Depo Lainnya</option>
            </select>
          </div>

          <div>
            <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
              Nominal Beban (Rp):
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-[11px]">Rp</span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="100.000"
                required
                min={1000}
                className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
              Penerima Dana (Supir/Staf):
            </label>
            <input
              type="text"
              value={formRecipient}
              onChange={(e) => setFormRecipient(e.target.value)}
              placeholder="Contoh: Pak Bambang (Supir Pickup)"
              required
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
            />
          </div>

          <div>
            <label className="text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 block mb-1">
              Keterangan Pengeluaran:
            </label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Isi rincian pengeluaran..."
              required
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 [body.light-theme_&]:bg-slate-50 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-900"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan Pengeluaran Kas Kecil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Log Kas Kecil & Otorisasi Manager */}
      <div className="glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950/80 [body.light-theme_&]:bg-slate-100 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Buku Kas Kecil & Otorisasi Pengeluaran Hari Ini</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({filteredItems.length} Catatan)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10.5px]">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10.5px]"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="BBM Armada">BBM Armada</option>
              <option value="Uang Makan / Jalan Supir">Uang Makan Supir</option>
              <option value="Pembelian Tisu / Segel Galon">Tisu & Segel</option>
              <option value="Tambal Ban & Servis Ringan">Tambal Ban & Servis</option>
              <option value="Maintenance Mesin Cuci / Filter">Maintenance Mesin</option>
              <option value="Operasional Depo Lainnya">Operasional Lainnya</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10.5px]"
            >
              <option value="ALL">Semua Status</option>
              <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-950 [body.light-theme_&]:bg-slate-200 text-[10px] font-black uppercase text-slate-400 [body.light-theme_&]:text-slate-700 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">ID & Waktu</th>
                <th className="py-2.5 px-3">Kategori Beban</th>
                <th className="py-2.5 px-3">Keterangan & Penerima</th>
                <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Otorisasi Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-slate-200 text-[11px]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Belum ada pengeluaran kas kecil pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-900/40 [body.light-theme_&]:hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono">
                      <strong className="text-white [body.light-theme_&]:text-slate-900 block leading-tight">
                        {item.id}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {item.date} • {item.time}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(item.category)}
                        <span className="font-semibold text-slate-200 [body.light-theme_&]:text-slate-800">
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-slate-300 [body.light-theme_&]:text-slate-700 leading-snug">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">
                        Penerima: {item.recipientName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 [body.light-theme_&]:text-rose-600">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.status === 'DISETUJUI' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>DISETUJUI</span>
                        </span>
                      )}
                      {item.status === 'MENUNGGU_PERSETUJUAN' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>MENUNGGU</span>
                        </span>
                      )}
                      {item.status === 'DITOLAK' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <X className="w-3 h-3" />
                          <span>DITOLAK</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.status === 'MENUNGGU_PERSETUJUAN' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            title="Setujui dan potong langsung dari kas fisik"
                          >
                            <Check className="w-3 h-3" />
                            <span>Setujui Beban</span>
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[10px] font-bold cursor-pointer"
                            title="Tolak pengeluaran"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : item.status === 'DISETUJUI' ? (
                        <span className="text-[10px] font-mono text-emerald-400/90 block">
                          Disahkan {item.approvedAt || 'Manager'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          Tidak disetujui
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
