import React, { useState, useEffect } from 'react';
import { OrderItem, ArmadaItem } from '../types';
import { ThermalReceiptModal, sendWhatsAppReceipt } from './ThermalReceiptModal';
import { Printer, Share2 } from 'lucide-react';

interface SpotOrderApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderItem[];
  armadaList: ArmadaItem[];
  onApproveDriverOrder: (orderId: string) => void;
  onScheduleNextDrop: (orderId: string) => void;
  preselectedOrderId?: string | null;
}

export const SpotOrderApprovalModal: React.FC<SpotOrderApprovalModalProps> = ({
  isOpen,
  onClose,
  orders,
  armadaList,
  onApproveDriverOrder,
  onScheduleNextDrop,
  preselectedOrderId,
}) => {
  const pendingOrders = orders.filter((o) => o.deliveryStatus === 'MENUNGGU_APPROVAL_ADMIN');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [receiptOrderToPrint, setReceiptOrderToPrint] = useState<OrderItem | null>(null);

  // Set initial selected order
  useEffect(() => {
    if (!isOpen) return;
    if (preselectedOrderId && pendingOrders.some((o) => o.id === preselectedOrderId)) {
      setSelectedOrderId(preselectedOrderId);
    } else if (pendingOrders.length > 0) {
      // Pick first pending order if current selection is invalid
      if (!selectedOrderId || !pendingOrders.some((o) => o.id === selectedOrderId)) {
        setSelectedOrderId(pendingOrders[0].id);
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [isOpen, preselectedOrderId, pendingOrders, selectedOrderId]);

  if (!isOpen) return null;

  const activeOrder = pendingOrders.find((o) => o.id === selectedOrderId) || pendingOrders[0] || null;

  // Find matching armada for the active order
  const matchingArmada = activeOrder
    ? armadaList.find(
        (a) =>
          (activeOrder.vehicleId && a.id === activeOrder.vehicleId) ||
          (activeOrder.assignedDriverId && a.id === activeOrder.assignedDriverId) ||
          a.driverName.toLowerCase().includes(activeOrder.driver.toLowerCase().split(' ')[0]) ||
          (activeOrder.driver && a.driverName.toLowerCase().includes(activeOrder.driver.toLowerCase().split(' ')[0]))
      )
    : null;

  const currentArmadaLoad = matchingArmada?.currentLoad ?? 0;
  const requiredGallons = activeOrder?.totalGalon ?? 0;
  const isStockSufficient = currentArmadaLoad >= requiredGallons;
  const shortageAmount = Math.max(0, requiredGallons - currentArmadaLoad);
  const remainingAfterApproval = Math.max(0, currentArmadaLoad - requiredGallons);

  const handleApprove = () => {
    if (!activeOrder) return;
    onApproveDriverOrder(activeOrder.id);

    // If there are other pending orders, navigate to the next one, else close
    const nextPending = pendingOrders.filter((o) => o.id !== activeOrder.id);
    if (nextPending.length > 0) {
      setSelectedOrderId(nextPending[0].id);
    } else {
      onClose();
    }
  };

  const handleScheduleNext = () => {
    if (!activeOrder) return;
    onScheduleNextDrop(activeOrder.id);

    // If there are other pending orders, navigate to the next one, else close
    const nextPending = pendingOrders.filter((o) => o.id !== activeOrder.id);
    if (nextPending.length > 0) {
      setSelectedOrderId(nextPending[0].id);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-t sm:border border-amber-400 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(245,158,11,0.35)]">
              <span>⚡</span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                PANEL APPROVAL ORDER LAPANGAN / SPOT SUPIR
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50">
                  {pendingOrders.length} Menunggu
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Validasi otomatis stok muatan armada supir & eksekusi persetujuan order lapangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        {pendingOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="text-4xl">🎉</div>
            <div className="text-sm font-bold text-slate-200">
              Semua Order Spot Telah Ditinjau & Disetujui!
            </div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada pesanan spot dari supir yang berstatus MENUNGGU_APPROVAL_ADMIN. Pesanan baru akan muncul di sini secara real-time.
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-all"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3 pr-1 text-xs">
            {/* Multiple Orders Selector Tabs */}
            {pendingOrders.length > 1 && (
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 shrink-0 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
                  Pilih Order:
                </span>
                {pendingOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      ord.id === activeOrder?.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>#{ord.id}</span>
                    <span className="opacity-80">({ord.customerName})</span>
                  </button>
                ))}
              </div>
            )}

            {activeOrder && (
              <div className="space-y-3">
                {/* 1. Header Order & Pelanggan Card */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {activeOrder.customerType === 'Rumah Tangga' ? '🏠' : '🏪'}
                        </span>
                        <h4 className="font-black text-sm text-white">{activeOrder.customerName}</h4>
                        <span className="text-[9.5px] font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                          #{activeOrder.id}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Supir: <strong className="text-cyan-300">{activeOrder.driver}</strong></span>
                        <span>•</span>
                        <span>Waktu: <strong className="font-mono text-slate-300">{activeOrder.time} WIB</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                        {activeOrder.customerType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                        ⏳ Menunggu Approval
                      </span>
                    </div>
                  </div>

                  {/* Customer Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="space-y-1">
                      <div>
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                          No HP / WhatsApp Pelanggan:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{activeOrder.phone || '-'}</span>
                          {activeOrder.phone && (
                            <a
                              href={`https://wa.me/${activeOrder.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[9.5px] font-bold border border-emerald-500/40 flex items-center gap-1"
                            >
                              <i className="fa-brands fa-whatsapp"></i>
                              <span>Chat WA</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {activeOrder.damagedItemsNote && (
                        <div>
                          <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                            Catatan Khusus Supir:
                          </span>
                          <span className="text-amber-300 italic text-[11px]">
                            "{activeOrder.damagedItemsNote}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div>
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                          Alamat Pengiriman:
                        </span>
                        <span className="text-slate-200">
                          {activeOrder.residentialDetail || 'Lokasi Kanvasing Lapangan'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase block">
                          Skema Galon & Pembayaran:
                        </span>
                        <span className="text-slate-300">
                          {activeOrder.gallonScheme} • <strong className="text-emerald-400">Rp {activeOrder.totalAmount.toLocaleString('id-ID')}</strong> ({activeOrder.paymentStatus})
                          {activeOrder.paymentMethod && <span className="ml-1 text-amber-300 font-bold font-mono">[{activeOrder.paymentMethod}]</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Banner Otomasi Sinkronisasi Tempo jika Metode Pembayaran TEMPO */}
                  {(activeOrder.paymentMethod?.toLowerCase().includes('tempo') ||
                    activeOrder.paymentStatus === 'Tempo / Hutang' ||
                    activeOrder.paymentMethod === 'TEMPO BON TOKO') && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-2">
                      <span className="text-base leading-none">💳</span>
                      <div>
                        <span className="font-black uppercase tracking-wider block">
                          METODE BAYAR: TEMPO BON TOKO (7 HARI)
                        </span>
                        <p className="text-[10.5px] text-slate-300 mt-0.5 leading-snug">
                          Menyetujui order ini otomatis membukukan kartu piutang baru (Jatuh tempo 7 hari, nominal <strong>Rp {activeOrder.totalAmount.toLocaleString('id-ID')}</strong>, status <strong>BELUM LUNAS</strong>) di modul <strong>Buku Piutang & Tempo</strong>, dan memperbarui counter badge navigasi secara real-time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Rincian Barang Dipesan & Retur Galon */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                      <i className="fa-solid fa-boxes-stacked"></i>
                      <span>Rincian Barang Dipesan & Retur Lapangan:</span>
                    </span>

                    {/* Quick Receipt & WhatsApp Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReceiptOrderToPrint(activeOrder)}
                        className="px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                        title="Buka & Cetak Struk Thermal 58mm/80mm"
                      >
                        <Printer className="w-3 h-3 text-cyan-400" />
                        <span>🖨️ Cetak Struk Thermal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          sendWhatsAppReceipt({
                            orderId: activeOrder.id,
                            customerName: activeOrder.customerName,
                            phone: activeOrder.phone,
                            driverName: activeOrder.driver,
                            vehicle: activeOrder.vehicleId,
                            items: activeOrder.items,
                            totalGalon: activeOrder.totalGalon,
                            emptyGallonsReturned: activeOrder.emptyGallonsReturned ?? activeOrder.totalGalon,
                            emptyGallonDebt: activeOrder.emptyGallonDebt,
                            totalAmount: activeOrder.totalAmount,
                            paymentMethod: activeOrder.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
                            paymentStatus: activeOrder.paymentStatus,
                            damagedNotes: activeOrder.damagedItemsNote,
                            time: activeOrder.time,
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                        title="Kirim Nota Struk Format Rapi ke WhatsApp Toko / Pelanggan"
                      >
                        <Share2 className="w-3 h-3 text-emerald-400" />
                        <span>📲 Kirim Nota WA ke Pelanggan</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white leading-snug">{activeOrder.items}</div>
                      <div className="text-[10px] text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          🔄 Tukar Galon Kosong: <strong>{activeOrder.emptyGallonsReturned ?? activeOrder.totalGalon} Tabung</strong>
                        </span>
                        {activeOrder.emptyGallonDebt && activeOrder.emptyGallonDebt > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                            ⚠️ Hutang Tabung: {activeOrder.emptyGallonDebt} Tabung
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-cyan-400 font-mono">
                        {activeOrder.totalGalon} <span className="text-xs font-normal text-slate-400">Tabung</span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400">
                        Total: Rp {activeOrder.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Validasi Otomatis Stok Muatan Armada Supir (CORE REQUIREMENT) */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                    isStockSufficient
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isStockSufficient ? '✅' : '⚠️'}</span>
                      <div>
                        <h4
                          className={`font-black text-xs sm:text-sm uppercase tracking-wider ${
                            isStockSufficient ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {isStockSufficient
                            ? 'STOK MUATAN ARMADA CUKUP (VALID)'
                            : 'STOK MUATAN ARMADA TIDAK CUKUP (KURANG)'}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Pengecekan otomatis ketersediaan stok fisik muatan kendaraan supir hari ini
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        isStockSufficient
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/60 animate-pulse'
                      }`}
                    >
                      {isStockSufficient ? 'Siap Eksekusi' : `Defisit ${shortageAmount} Galon`}
                    </span>
                  </div>

                  {/* Armada Cargo Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[9.5px] text-slate-400 uppercase font-bold block">
                        Stok di Armada:
                      </span>
                      <span className="text-base font-black font-mono text-white mt-0.5 block">
                        {currentArmadaLoad} <span className="text-[10px] text-slate-400">Gln</span>
                      </span>
                      <span className="text-[8.5px] text-slate-400 truncate block">
                        {matchingArmada ? `${matchingArmada.vehicleType} (${matchingArmada.plateNumber})` : activeOrder.driver}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[9.5px] text-amber-400 uppercase font-bold block">
                        Kebutuhan Order:
                      </span>
                      <span className="text-base font-black font-mono text-amber-300 mt-0.5 block">
                        {requiredGallons} <span className="text-[10px] text-slate-400">Gln</span>
                      </span>
                      <span className="text-[8.5px] text-slate-400 truncate block">
                        Order #{activeOrder.id}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[9.5px] text-slate-400 uppercase font-bold block">
                        Sisa Muatan:
                      </span>
                      <span
                        className={`text-base font-black font-mono mt-0.5 block ${
                          isStockSufficient ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isStockSufficient ? `${remainingAfterApproval} Gln` : `-${shortageAmount} Gln`}
                      </span>
                      <span className="text-[8.5px] text-slate-400 truncate block">
                        {isStockSufficient ? 'Aman Diberikan' : 'Kekurangan Muatan'}
                      </span>
                    </div>
                  </div>

                  {/* Informative Guidance Text */}
                  <div className="text-[11px] leading-relaxed pt-0.5 space-y-1">
                    {isStockSufficient ? (
                      <p className="text-emerald-200/90">
                        ✨ Muatan supir <strong>mencukupi ({currentArmadaLoad} galon &ge; {requiredGallons} galon)</strong>.
                        Menekan tombol <strong>[Setujui & Potong Muatan]</strong> akan memotong muatan armada hari ini menjadi <strong>{remainingAfterApproval} galon</strong>, mengubah status menjadi <strong>SELESAI</strong>, dan membukukan komisi ke supir.
                      </p>
                    ) : (
                      <p className="text-rose-200/90">
                        ⚠️ Muatan supir di kendaraan <strong>tidak mencukupi ({currentArmadaLoad} galon &lt; {requiredGallons} galon)</strong>.
                        Disarankan menekan tombol <strong>[Setujui Drop Besok]</strong> untuk mengalihkan pesanan ke status <strong>JADWAL_DROP_BERIKUTNYA</strong> dari gudang depo tanpa memotong muatan supir hari ini.
                      </p>
                    )}

                    {/* Sinkronisasi Tabung Kosong Armada */}
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-cyan-300 flex items-start gap-1.5">
                      <span className="text-xs">🔄</span>
                      <span>
                        <strong>Sinkronisasi Tabung Retur:</strong> Sebanyak <strong>{activeOrder.emptyGallonsReturned ?? activeOrder.totalGalon} galon kosong</strong> yang ditarik supir akan langsung dibukukan ke beban tabung armada supir <strong>({matchingArmada?.driverName || activeOrder.driver})</strong>, mengurangi kewajiban galon kosong yang harus dibawa kembali ke depo saat check-in sore.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Modal Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReceiptOrderToPrint(activeOrder)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Struk Thermal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendWhatsAppReceipt({
                          orderId: activeOrder.id,
                          customerName: activeOrder.customerName,
                          phone: activeOrder.phone,
                          driverName: activeOrder.driver,
                          vehicle: activeOrder.vehicleId,
                          items: activeOrder.items,
                          totalGalon: activeOrder.totalGalon,
                          emptyGallonsReturned: activeOrder.emptyGallonsReturned ?? activeOrder.totalGalon,
                          emptyGallonDebt: activeOrder.emptyGallonDebt,
                          totalAmount: activeOrder.totalAmount,
                          paymentMethod: activeOrder.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
                          paymentStatus: activeOrder.paymentStatus,
                          damagedNotes: activeOrder.damagedItemsNote,
                          time: activeOrder.time,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-500/40 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Nota WA</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Tutup
                    </button>

                    {/* Tombol [ 📅 Setujui Drop Besok ] */}
                    <button
                      type="button"
                      onClick={handleScheduleNext}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border ${
                        !isStockSufficient
                          ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)] font-black animate-pulse'
                          : 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border-blue-500/40'
                      }`}
                      title="Alihkan pesanan ke status JADWAL_DROP_BERIKUTNYA untuk dikirim dari stok depo besok pagi tanpa potong muatan armada hari ini"
                    >
                      <span>📅</span>
                      <span>Setujui Drop Besok</span>
                    </button>

                    {/* Tombol [ ✅ Setujui & Potong Muatan ] */}
                    <button
                      type="button"
                      disabled={!isStockSufficient}
                      onClick={handleApprove}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 ${
                        isStockSufficient
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.45)] cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        isStockSufficient
                          ? 'Setujui pesanan, potong stok muatan armada supir hari ini, ubah status menjadi SELESAI & bukukan komisi'
                          : `Stok muatan supir tidak cukup (${currentArmadaLoad} < ${requiredGallons} galon). Silakan pilih [Setujui Drop Besok]`
                      }
                    >
                      <span>✅</span>
                      <span>Setujui & Potong Muatan</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Preview & Cetak Struk Thermal */}
      <ThermalReceiptModal
        isOpen={Boolean(receiptOrderToPrint)}
        onClose={() => setReceiptOrderToPrint(null)}
        order={receiptOrderToPrint}
      />
    </div>
  );
};
