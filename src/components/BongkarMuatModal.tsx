import React, { useState } from 'react';
import { InboundDropItem, ProductMasterItem } from '../types';
import { SyncStatus } from '../utils/cloudSync';
import {
  X,
  Truck,
  Plus,
  CheckCircle2,
  Package,
  Calendar,
  Clock,
  Building2,
  FileText,
  RotateCcw,
  Box,
  Share2,
  Layers,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

interface BongkarMuatModalProps {
  isOpen: boolean;
  onClose: () => void;
  inboundDrops: InboundDropItem[];
  products: ProductMasterItem[];
  onConfirmBongkar: (dropData: {
    sjNumber: string;
    supplier: string;
    filledGallonsIn: number;
    emptyGallonsExchanged: number;
    dusKemasanIn: number;
    selectedSkuId?: string;
    driverName?: string;
    vehiclePlate?: string;
    itemsDescription: string;
    picWarehouse?: string;
    notes?: string;
  }) => void;
  syncStatus?: SyncStatus;
}

export const BongkarMuatModal: React.FC<BongkarMuatModalProps> = ({
  isOpen,
  onClose,
  inboundDrops,
  products,
  onConfirmBongkar,
  syncStatus = 'offline',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [sjNumber, setSjNumber] = useState(`SJ-PAB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplier, setSupplier] = useState('Pabrik Danone Subang');
  const [selectedSkuId, setSelectedSkuId] = useState<string>('PRD-04'); // Default Cleo or first critical
  const [filledGallonsIn, setFilledGallonsIn] = useState<number>(200);
  const [emptyGallonsExchanged, setEmptyGallonsExchanged] = useState<number>(200);
  const [dusKemasanIn, setDusKemasanIn] = useState<number>(50);
  const [driverName, setDriverName] = useState('Pak Joko Sutrisno');
  const [vehiclePlate, setVehiclePlate] = useState('B 9801 UDA (Truk Fuso)');
  const [picWarehouse, setPicWarehouse] = useState('Ahmad Fauzi (Staf Tabung)');
  const [itemsDescription, setItemsDescription] = useState('Tabung segel utuh resmi pabrik + dus');
  const [notes, setNotes] = useState('Lolos uji visual, tutup segel hologram utuh.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Totals
  const totalDrops = inboundDrops.length;
  const totalFilledIn = inboundDrops.reduce((acc, d) => acc + (d.filledGallonsIn || 0), 0);
  const totalEmptyOut = inboundDrops.reduce((acc, d) => acc + (d.emptyGallonsExchanged || 0), 0);
  const totalDusIn = inboundDrops.reduce((acc, d) => acc + (d.dusKemasanIn || 0), 0);

  // Filtered drops
  const filteredDrops = inboundDrops.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.sjNumber.toLowerCase().includes(q) ||
      d.supplier.toLowerCase().includes(q) ||
      (d.driverName && d.driverName.toLowerCase().includes(q)) ||
      (d.itemsDescription && d.itemsDescription.toLowerCase().includes(q))
    );
  });

  const handleOpenAddForm = (prefillSkuId?: string) => {
    const newSj = `SJ-PAB-${Math.floor(1000 + Math.random() * 9000)}`;
    setSjNumber(newSj);
    if (prefillSkuId) {
      setSelectedSkuId(prefillSkuId);
      if (prefillSkuId === 'PRD-04') {
        setSupplier('PT Sariguna Primatirta (Cleo)');
        setFilledGallonsIn(200);
        setEmptyGallonsExchanged(200);
        setDusKemasanIn(0);
        setItemsDescription('200 Tabung Cleo Pure Water Smart Gallon 19L Segel');
      } else if (prefillSkuId === 'PRD-05') {
        setSupplier('Danone Vit Depo');
        setFilledGallonsIn(0);
        setEmptyGallonsExchanged(0);
        setDusKemasanIn(200);
        setItemsDescription('200 Dus Vit Botol 600ml (Isi 24 Botol)');
      }
    }
    setShowAddForm(true);
  };

  const handleSubmitBongkar = (e: React.FormEvent) => {
    e.preventDefault();
    if (filledGallonsIn <= 0 && dusKemasanIn <= 0) {
      alert('Kuantitas tabung terisi atau kemasan dus masuk harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProd = products.find((p) => p.id === selectedSkuId);
      const desc =
        itemsDescription ||
        (selectedProd
          ? `${filledGallonsIn > 0 ? filledGallonsIn + ' Tabung ' : ''}${selectedProd.name}${dusKemasanIn > 0 ? ' + ' + dusKemasanIn + ' Dus' : ''}`
          : `${filledGallonsIn} Tabung Terisi + ${dusKemasanIn} Dus`);

      onConfirmBongkar({
        sjNumber: sjNumber.trim() || `SJ-${Date.now().toString().slice(-4)}`,
        supplier: supplier.trim(),
        filledGallonsIn: Number(filledGallonsIn) || 0,
        emptyGallonsExchanged: Number(emptyGallonsExchanged) || 0,
        dusKemasanIn: Number(dusKemasanIn) || 0,
        selectedSkuId,
        driverName: driverName.trim(),
        vehiclePlate: vehiclePlate.trim(),
        itemsDescription: desc,
        picWarehouse: picWarehouse.trim(),
        notes: notes.trim(),
      });

      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsappReceipt = (drop: InboundDropItem) => {
    const text =
      `*BERITA ACARA BONGKAR MUAT (INBOUND WAREHOUSE)*\n` +
      `No. Surat Jalan: *${drop.sjNumber}*\n` +
      `Pabrik/Supplier: *${drop.supplier}*\n` +
      `Waktu Bongkar: ${drop.date} (${drop.time})\n\n` +
      `📦 *Rincian Barang Diterima:*\n` +
      `• Tabung Terisi Masuk: *${drop.filledGallonsIn} Tabung*\n` +
      `• Tabung Kosong Disetor (Tukar Guling): *${drop.emptyGallonsExchanged} Tabung*\n` +
      `• Kemasan Dus Masuk: *${drop.dusKemasanIn} Dus*\n` +
      `• Muatan: ${drop.itemsDescription}\n\n` +
      `🚚 Armada: ${drop.vehiclePlate || '-'} (${drop.driverName || 'Supir Pabrik'})\n` +
      `👤 PIC Penerima: ${drop.picWarehouse}\n` +
      `Status: *SELESAI BONGKAR & STOK MASUK GUDA SAH*\n\n` +
      `_Pencatatan Otomatis Depo Tirta Mandiri - JacS DepoHub Pro_`;

    navigator.clipboard.writeText(text);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border-2 border-purple-500/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/50 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.45)]">
              <Truck className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  BONGKAR MUAT BARANG (INBOUND SUPPLY CHAIN)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {totalDrops} DROP PABRIK
                </span>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {syncStatus === 'synced' ? 'Auto Sync Sheets' : 'Offline Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pencatatan kedatangan pasokan armada pabrik, tukar guling tabung kosong, dan penambahan kuota stok gudang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Metric Counters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Kedatangan</div>
              <div className="text-base font-mono font-extrabold text-purple-400">
                {totalDrops} Drop Truk
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Tabung Terisi Masuk</div>
              <div className="text-base font-mono font-extrabold text-emerald-400">
                +{totalFilledIn.toLocaleString('id-ID')} Tbg
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Tukar Guling Kosong</div>
              <div className="text-base font-mono font-extrabold text-amber-400">
                -{totalEmptyOut.toLocaleString('id-ID')} Tbg
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Kemasan Dus Masuk</div>
              <div className="text-base font-mono font-extrabold text-cyan-400">
                +{totalDusIn.toLocaleString('id-ID')} Dus
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No SJ, Supplier, Supir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-52 sm:w-64"
                />
              </div>

              {/* Quick Restock Critical SKU buttons */}
              <button
                type="button"
                onClick={() => handleOpenAddForm('PRD-04')}
                className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-1 cursor-pointer"
                title="Bongkar muat langsung untuk Cleo Smart Gallon yang berstatus E-Warning Kritis"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restock Cleo Galon</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddForm('PRD-05')}
                className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1 cursor-pointer"
                title="Bongkar muat langsung untuk Vit Botol 600ml yang berstatus E-Warning Kritis"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restock Vit 600ml</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenAddForm()}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.45)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 font-black" />
              <span>Catat Drop Masuk Baru</span>
            </button>
          </div>

          {/* Form Modal / Collapsible Section */}
          {showAddForm && (
            <div className="p-4 rounded-xl bg-slate-950/90 border-2 border-purple-500/70 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    Form Pencatatan Kedatangan Armada & Konfirmasi Bongkar
                  </h4>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitBongkar} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      No. Surat Jalan Pabrik (SJ) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sjNumber}
                      onChange={(e) => setSjNumber(e.target.value)}
                      placeholder="Contoh: SJ-DAN-8812"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nama Pabrik / Supplier <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="Pabrik Danone Subang">Pabrik Danone Subang (Aqua & Vit)</option>
                      <option value="PT Sariguna Primatirta (Cleo)">PT Sariguna Primatirta (Cleo)</option>
                      <option value="Depo Mayora Distribusi">Depo Mayora Distribusi (Le Minerale)</option>
                      <option value="Danone Vit Depo">Danone Vit Depo</option>
                      <option value="PT Tirta Varia Intipratama">PT Tirta Varia Intipratama</option>
                      <option value="Supplier Lainnya">Supplier / Distributor Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Target SKU Restock Gudang
                    </label>
                    <select
                      value={selectedSkuId}
                      onChange={(e) => setSelectedSkuId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-purple-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantitative Steppers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-950/20 rounded-xl border border-purple-500/30">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                      📥 Tabung Terisi Masuk (Tbg)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilledGallonsIn((prev) => Math.max(0, prev - 25))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={filledGallonsIn}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setFilledGallonsIn(val);
                          // Suggest matching empty gallon return
                          if (emptyGallonsExchanged === 0 || emptyGallonsExchanged === filledGallonsIn) {
                            setEmptyGallonsExchanged(val);
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-emerald-500/40 rounded text-center text-sm font-mono font-bold text-emerald-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setFilledGallonsIn((prev) => prev + 25)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">
                      Menambah stok terisi di gudang
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 mb-1">
                      🔄 Tabung Kosong Disetor (Tukar Guling)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEmptyGallonsExchanged((prev) => Math.max(0, prev - 25))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={emptyGallonsExchanged}
                        onChange={(e) => setEmptyGallonsExchanged(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-amber-500/40 rounded text-center text-sm font-mono font-bold text-amber-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEmptyGallonsExchanged((prev) => prev + 25)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">
                      Mengurangi tabung kosong di depo
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-400 mb-1">
                      📦 Kemasan Dus Masuk (Dus)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDusKemasanIn((prev) => Math.max(0, prev - 10))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={dusKemasanIn}
                        onChange={(e) => setDusKemasanIn(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-cyan-500/40 rounded text-center text-sm font-mono font-bold text-cyan-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setDusKemasanIn((prev) => prev + 10)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">
                      Kemasan botol / cup / karton
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nama Supir Pabrik
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Nama supir pengantar"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Plat Nomor & Jenis Armada
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Contoh: B 9801 UDA (Fuso)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Petugas Penerima Gudang (PIC)
                    </label>
                    <input
                      type="text"
                      value={picWarehouse}
                      onChange={(e) => setPicWarehouse(e.target.value)}
                      placeholder="Petugas gudang validator"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Keterangan Muatan & Kondisi Segel Tabung
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Segel tutup utuh, tutup segel bebas retak, lolos uji kebersihan."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 font-bold" />
                    <span>Konfirmasi Bongkar & Tambah Stok</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Drops History Table */}
          <div className="bg-slate-950/70 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Riwayat Kedatangan & Penerimaan Armada Pabrik
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredDrops.length} Dokumen Surat Jalan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[10.5px] uppercase font-bold text-slate-400">
                    <th className="px-3 py-2.5">No. Surat Jalan</th>
                    <th className="px-3 py-2.5">Pabrik / Supplier</th>
                    <th className="px-3 py-2.5">Waktu Kedatangan</th>
                    <th className="px-3 py-2.5 text-center">Tabung Masuk</th>
                    <th className="px-3 py-2.5 text-center">Tukar Kosong</th>
                    <th className="px-3 py-2.5 text-center">Kemasan Dus</th>
                    <th className="px-3 py-2.5">Supir & Armada</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredDrops.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                        Tidak ada riwayat bongkar muat yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredDrops.map((drop) => (
                      <tr key={drop.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            {drop.sjNumber}
                          </div>
                          <span className="text-[9px] text-slate-500 block font-normal font-sans">
                            {drop.id}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-sans font-medium text-slate-200">
                          {drop.supplier}
                        </td>
                        <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                          <div>{drop.date}</div>
                          <span className="text-[9.5px] text-slate-500">{drop.time}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            +{drop.filledGallonsIn} Tbg
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            -{drop.emptyGallonsExchanged} Tbg
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                            +{drop.dusKemasanIn} Dus
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-sans text-slate-300">
                          <div>{drop.driverName || 'Supir Pabrik'}</div>
                          <span className="text-[9.5px] text-slate-500 font-mono">
                            {drop.vehiclePlate || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[9.5px] border border-purple-500/40">
                            ● SELESAI BONGKAR
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleShareWhatsappReceipt(drop)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 ml-auto cursor-pointer transition-all"
                            title="Kirim Berita Acara Bongkar Muat via WA"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Kirim BA</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Sinkronisasi telemetri gudang otomatis mengupdate kapasitas fisik & kuota aman produk
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
