import React, { useState, useEffect } from 'react';
import { ProductMasterItem, PurchaseOrderItem } from '../types';
import { calculateStockWarning } from '../utils/stockWarning';
import {
  X,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  Share2,
  CheckCircle2,
  Package,
  Plus,
  Trash2,
  Truck,
  Sparkles,
  Phone,
} from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductMasterItem[];
  onConfirmPO?: (po: PurchaseOrderItem) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  onConfirmPO,
}) => {
  const [supplierName, setSupplierName] = useState<string>('PT Sariguna Primatirta (Cleo) & Danone');
  const [supplierPhone, setSupplierPhone] = useState<string>('0811-2233-4455');
  const [poNumber, setPoNumber] = useState<string>('');
  const [etaDelivery, setEtaDelivery] = useState<string>('Besok Pagi (Pukul 08:00 - 10:00 WIB)');
  const [poNotes, setPoNotes] = useState<string>(
    'Mohon kirim armada wingbox/fuso dengan kondisi tabung baru/segel utuh. Tabung kosong tukar guling telah disiapkan di area loading dock.'
  );

  interface DraftItem {
    productId: string;
    productName: string;
    currentStock: number;
    recommendedQty: number;
    orderQty: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
    isCritical: boolean;
  }

  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  // Automatically detect and populate critical SKU items on open
  useEffect(() => {
    if (isOpen) {
      const generatedPoNum = `PO-${new Date().getFullYear()}${(new Date().getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setPoNumber(generatedPoNum);

      // Find critical & warning products
      const criticalOrWarn = products
        .map((p) => {
          const warn = calculateStockWarning(p);
          return { product: p, warning: warn };
        })
        .filter((item) => item.warning.isCritical || item.warning.isWarning || item.product.id === 'PRD-04' || item.product.id === 'PRD-05');

      const items: DraftItem[] = [];

      criticalOrWarn.forEach(({ product, warning }) => {
        // Calculate recommended order up to 70% of maxCapacity or safe level
        const targetSafe = Math.round(warning.maxCapacity * 0.7) || (product.minStock * 2);
        const needed = Math.max(20, targetSafe - warning.currentStock);
        const roundedOrder = Math.ceil(needed / 10) * 10; // Round to tens

        items.push({
          productId: product.id,
          productName: product.name,
          currentStock: warning.currentStock,
          recommendedQty: roundedOrder,
          orderQty: roundedOrder,
          unit: product.unit,
          unitPrice: product.hpp || 15000,
          subtotal: roundedOrder * (product.hpp || 15000),
          isCritical: warning.isCritical || product.id === 'PRD-04' || product.id === 'PRD-05',
        });
      });

      // If somehow none found, ensure Cleo & Vit 600ml are present
      if (!items.some((i) => i.productId === 'PRD-04')) {
        items.unshift({
          productId: 'PRD-04',
          productName: 'Cleo Pure Water Smart Gallon',
          currentStock: 75,
          recommendedQty: 125,
          orderQty: 125,
          unit: 'Tabung',
          unitPrice: 14500,
          subtotal: 125 * 14500,
          isCritical: true,
        });
      }

      if (!items.some((i) => i.productId === 'PRD-05')) {
        items.push({
          productId: 'PRD-05',
          productName: 'Vit Botol 600ml (1 Dus isi 24)',
          currentStock: 145,
          recommendedQty: 200,
          orderQty: 200,
          unit: 'Dus',
          unitPrice: 32000,
          subtotal: 200 * 32000,
          isCritical: true,
        });
      }

      setDraftItems(items);
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const totalPoAmount = draftItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuantity = draftItems.reduce((sum, item) => sum + item.orderQty, 0);

  const handleUpdateQty = (idx: number, newQty: number) => {
    setDraftItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const safeQty = Math.max(0, newQty);
          return {
            ...item,
            orderQty: safeQty,
            subtotal: safeQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (idx: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const generateFormalWaMessage = (): string => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let itemsList = '';
    draftItems.forEach((item, index) => {
      itemsList += `${index + 1}. *${item.productName}*: ${item.orderQty} ${item.unit} @ Rp ${item.unitPrice.toLocaleString('id-ID')}\n   _Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}_\n`;
    });

    return `*SURAT PESANAN RESMI (PURCHASE ORDER) - JACS DEPOHUB*\n` +
      `No. PO: *${poNumber}*\n` +
      `Tanggal: ${todayStr}\n\n` +
      `Kepada Yth.\n` +
      `*Divisi Logistik & Distribusi Pabrik*\n` +
      `Supplier: *${supplierName}*\n\n` +
      `Dengan hormat,\n` +
      `Berdasarkan sistem e-warning telemetri stok gudang Depo Tirta Mandiri Subang, bersama ini kami menerbitkan Purchase Order (PO) pengadaan barang:\n\n` +
      `${itemsList}\n` +
      `💰 *TOTAL ESTIMASI NILAI PO: Rp ${totalPoAmount.toLocaleString('id-ID')}*\n` +
      `📦 *Total Volume Barang:* ${totalQuantity} Unit/Karton\n\n` +
      `📍 *Lokasi Pengiriman (Gudang Depo):*\n` +
      `Jl. Raya Subang No. 88, Karanganyar, Subang, Jawa Barat\n` +
      `⏰ *Permohonan Waktu Drop Pabrik:* ${etaDelivery}\n` +
      `👤 *PIC Penerima Gudang:* Bpk. Irfan Hakim / Ahmad Fauzi (0812-9876-5432)\n` +
      `🔄 *Skema Bongkar:* Tukar Guling Tabung Kosong Siap Muat di Depo\n\n` +
      `📝 *Catatan Khusus:* ${poNotes}\n\n` +
      `Mohon konfirmasi kesiapan armada pabrik & penerbitan nomor Surat Jalan (SJ). Terima kasih atas kerja samanya! 🙏\n\n` +
      `_Diterbitkan secara otomatis melalui JacS DepoHub Pro Supply Chain System_`;
  };

  const handlePublishAndSendWa = () => {
    const message = generateFormalWaMessage();

    // Copy to clipboard
    navigator.clipboard.writeText(message);

    // Save PO Record
    const poRecord: PurchaseOrderItem = {
      id: `PO-REC-${Date.now().toString().slice(-4)}`,
      poNumber,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      supplier: supplierName,
      items: draftItems,
      totalAmount: totalPoAmount,
      status: 'DIKIRIM_KE_PABRIK',
      etaNote: etaDelivery,
      notes: poNotes,
    };

    if (onConfirmPO) {
      onConfirmPO(poRecord);
    }

    // Open WhatsApp
    const cleanPhone = supplierPhone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-rose-500/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <FileText className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  PENERBITAN PURCHASE ORDER (PO) PABRIK
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  E-WARNING RESTOCK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Otomatisasi pengadaan pasokan untuk SKU di bawah ambang batas toleransi safety stock
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

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {/* E-Warning Notice Banner */}
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 space-y-1">
            <div className="flex items-center gap-2 font-black text-xs text-rose-300 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Rekomendasi Otomatis Telemetri Gudang:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Sistem telemetri mendeteksi stok kritis pada <strong>Cleo Smart Gallon</strong> (Sisa 75 &le; batas 100 tabung) dan <strong>Vit Botol 600ml</strong> (Sisa 145 &le; batas 150 dus). Draft di bawah telah diisi otomatis dengan kuantitas order yang direkomendasikan hingga mencapai level aman gudang (70% kapasitas).
            </p>
          </div>

          {/* Supplier & Header Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nomor Dokumen PO:
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pabrik / Prinsipal Supplier:
              </label>
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="PT Sariguna Primatirta (Cleo) & Danone">PT Sariguna Primatirta & Danone Subang</option>
                <option value="Pabrik Danone Subang">Pabrik Danone Aqua Subang</option>
                <option value="Danone Vit Depo Cibinong">Danone Vit Depo Cibinong</option>
                <option value="Depo Mayora Distribusi">Depo Mayora Distribusi (Le Minerale)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                No. WhatsApp Supplier / Logistik:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="0811-..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Table Items PO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Rincian Barang & Kuantitas Order (PO):</span>
              </h4>
              <span className="text-[10.5px] font-mono text-slate-400">
                {draftItems.length} SKU Siap Dipesan
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Nama Produk / SKU</th>
                    <th className="py-2 px-3 text-center">Stok Saat Ini</th>
                    <th className="py-2 px-3 text-center">Rekomendasi</th>
                    <th className="py-2 px-3 text-center w-36">Jumlah Dipesan</th>
                    <th className="py-2 px-3 text-right">Harga Pabrik (HPP)</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                    <th className="py-2 px-2 text-center w-8">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {draftItems.map((item, idx) => (
                    <tr
                      key={item.productId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.isCritical ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          {item.isCritical && (
                            <span className="text-rose-400 font-mono text-xs">🚨</span>
                          )}
                          <span>{item.productName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {item.productId} • Satuan: {item.unit}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center font-mono">
                        <span
                          className={`font-bold ${
                            item.isCritical ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                          +{item.recommendedQty} {item.unit}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, item.orderQty - 10)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={item.orderQty}
                            onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 0)}
                            className="w-16 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-center font-mono font-black text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, item.orderQty + 10)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-slate-300">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-6 h-6 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                          title="Hapus baris item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Permohonan Waktu Pengiriman Pabrik:
              </label>
              <input
                type="text"
                value={etaDelivery}
                onChange={(e) => setEtaDelivery(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Catatan Khusus Pabrik (Skema Tukar Guling / QC):
              </label>
              <input
                type="text"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Total Summary Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                RANGKUMAN PENGAJUAN PURCHASE ORDER:
              </span>
              <div className="text-xl font-mono font-black text-rose-400">
                Rp {totalPoAmount.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-400">
                Total Volume Order: {totalQuantity} Unit • Skema Tukar Tabung Depo
              </span>
            </div>

            <div className="text-right text-[10px] text-slate-400 space-y-0.5">
              <div>Syarat Bayar: <strong>Tempo Pabrik 14 Hari (Kredit Prinsipal)</strong></div>
              <div>Pengesahan: <strong>Super Admin & Staf Tabung Gudang</strong></div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>

          {/* Prominent Action Button: [ 📤 Terbitkan PO & Kirim WA Supplier ] */}
          <button
            type="button"
            disabled={draftItems.length === 0 || totalQuantity === 0}
            onClick={handlePublishAndSendWa}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(16,185,129,0.45)] flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>📤 Terbitkan PO & Kirim WA Supplier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
