import React, { useState } from 'react';
import { OrderItem } from '../types';
import { Printer, Share2, X, CheckCircle2, Clock, Phone, MapPin, Truck, AlertCircle } from 'lucide-react';
import { getDepoProfile } from '../utils/depoProfile';

export interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderItem | null;
  depoName?: string;
  depoAddress?: string;
  depoPhone?: string;
}

/**
 * Generate formatted WhatsApp message for receipt delivery to store owner / customer
 * Sesuai spesifikasi template:
 * - Salam
 * - Nama Depo
 * - Detail Pesanan
 * - Status Pembayaran
 * - Catatan Retur Galon
 */
export function generateWhatsAppReceiptText(params: {
  depoName?: string;
  depoPhone?: string;
  orderId: string;
  customerName: string;
  phone?: string;
  driverName?: string;
  vehicle?: string;
  items: string;
  totalGalon?: number;
  emptyGallonsReturned?: number;
  emptyGallonDebt?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  damagedNotes?: string;
  time?: string;
}): string {
  const depo = params.depoName || 'JacS DepoHub Pro';
  const waktu = params.time || `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
  
  const returnCount = params.emptyGallonsReturned !== undefined 
    ? params.emptyGallonsReturned 
    : (params.totalGalon || 0);
  
  const returnText = returnCount > 0 
    ? `${returnCount} Tabung Galon Kosong Ditarik (Tukar Fisik Selesai)`
    : 'Tidak ada penyerahan tabung kosong';

  const debtText = params.emptyGallonDebt && params.emptyGallonDebt > 0
    ? `\n⚠️ *Hutang Tabung Galon:* ${params.emptyGallonDebt} Tabung (Wajib diserahkan pada pengiriman berikutnya)`
    : '';

  const damageText = params.damagedNotes 
    ? `\n⚠️ *Catatan Retur Rusak/Afkir:* ${params.damagedNotes}` 
    : '';

  const paymentText = params.paymentStatus === 'Lunas' 
    ? `✅ *LUNAS*${params.paymentMethod ? ` (${params.paymentMethod})` : ''}` 
    : `⏳ *TEMPO / BON TOKO* (Jatuh tempo 7 hari)`;

  return (
    `*Yth. Bapak/Ibu ${params.customerName},*\n` +
    `_Assalamu'alaikum Wr. Wb. / Salam Sejahtera_\n\n` +
    `Terima kasih telah mempercayakan pasokan air mineral kepada:\n` +
    `🏢 *${depo}*\n` +
    `----------------------------------------\n` +
    `📄 *No. Faktur / Nota:* #${params.orderId}\n` +
    `⏰ *Waktu Transaksi:* ${waktu}\n` +
    `👤 *Nama Toko/Pelanggan:* ${params.customerName}\n` +
    (params.driverName ? `🚚 *Supir / Kurir:* ${params.driverName}${params.vehicle ? ` (${params.vehicle})` : ''}\n` : '') +
    `----------------------------------------\n` +
    `📦 *DETAIL PESANAN:*\n` +
    `${params.items}\n\n` +
    `💰 *TOTAL PEMBAYARAN:* *Rp ${params.totalAmount.toLocaleString('id-ID')}*\n` +
    `💳 *Status Pembayaran:* ${paymentText}\n` +
    `----------------------------------------\n` +
    `🔄 *CATATAN RETUR GALON KOSONG:*\n` +
    `• Jumlah Galon Kosong Kembali: *${returnText}*` +
    debtText +
    damageText +
    `\n----------------------------------------\n` +
    `_Struk & Bukti Antar digital ini sah diterbitkan oleh sistem logistik ${depo}._\n` +
    `Layanan Pelanggan / Pesan Ulang: ${params.depoPhone || '0812-9988-7711'}`
  );
}

export function sendWhatsAppReceipt(params: {
  depoName?: string;
  depoPhone?: string;
  orderId: string;
  customerName: string;
  phone?: string;
  driverName?: string;
  vehicle?: string;
  items: string;
  totalGalon?: number;
  emptyGallonsReturned?: number;
  emptyGallonDebt?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  damagedNotes?: string;
  time?: string;
}) {
  const phone = (params.phone || '').replace(/\D/g, '');
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  const message = generateWhatsAppReceiptText(params);
  
  if (cleanPhone) {
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  }
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  depoName: propDepoName,
  depoAddress: propDepoAddress,
  depoPhone: propDepoPhone,
}) => {
  const [paperFormat, setPaperFormat] = useState<'58mm' | '80mm'>('58mm');
  const [isCopied, setIsCopied] = useState(false);

  const profile = getDepoProfile();
  const depoName = propDepoName && propDepoName !== 'JacS DepoHub Pro' ? propDepoName : (profile.name || 'JacS DepoHub Pro');
  const depoAddress = propDepoAddress && propDepoAddress !== 'Jl. Raya Cipeundeuy - Subang Km. 12, Jawa Barat' ? propDepoAddress : (profile.address || 'Jl. Raya Subang - Bandung KM 4.5');
  const depoPhone = propDepoPhone && propDepoPhone !== '0812-9988-7711' ? propDepoPhone : (profile.phone || '0812-9988-7711');

  if (!isOpen || !order) return null;

  const returnGallons = order.emptyGallonsReturned !== undefined
    ? order.emptyGallonsReturned
    : (order.totalGalon || 0);

  const debtGallons = order.emptyGallonDebt !== undefined
    ? order.emptyGallonDebt
    : Math.max(0, (order.totalGalon || 0) - returnGallons);

  const waktuCetak = order.podCompletedTime 
    ? `${order.time} / Selesai: ${order.podCompletedTime} WIB`
    : `${order.time || '10:00'} WIB`;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    sendWhatsAppReceipt({
      depoName,
      depoPhone,
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      driverName: order.driver,
      vehicle: order.vehicleId,
      items: order.items,
      totalGalon: order.totalGalon,
      emptyGallonsReturned: returnGallons,
      emptyGallonDebt: debtGallons,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
      paymentStatus: order.paymentStatus,
      damagedNotes: order.damagedItemsNote,
      time: waktuCetak,
    });
  };

  const handleCopyText = () => {
    const text = generateWhatsAppReceiptText({
      depoName,
      depoPhone,
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      driverName: order.driver,
      vehicle: order.vehicleId,
      items: order.items,
      totalGalon: order.totalGalon,
      emptyGallonsReturned: returnGallons,
      emptyGallonDebt: debtGallons,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentStatus === 'Lunas' ? 'Tunai / QRIS' : 'Tempo Bon Toko',
      paymentStatus: order.paymentStatus,
      damagedNotes: order.damagedItemsNote,
      time: waktuCetak,
    });
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Scoped print styles for thermal printers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible;
          }
          #thermal-receipt-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: ${paperFormat === '58mm' ? '58mm' : '80mm'};
            max-width: ${paperFormat === '58mm' ? '58mm' : '80mm'};
            margin: 0;
            padding: 4px;
            font-size: ${paperFormat === '58mm' ? '10px' : '12px'};
            line-height: 1.25;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col max-h-[95vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(6,182,212,0.35)]">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                CETAK STRUK & BUKTI ANTAR THERMAL
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  order.paymentStatus === 'Lunas'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {order.paymentStatus}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Format Thermal POS (58mm / 80mm) & Otomasi Nota WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Format Selector Tabs */}
        <div className="py-2.5 flex items-center justify-between gap-2 border-b border-slate-800/80 shrink-0">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <span>Pilih Lebar Kertas:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPaperFormat('58mm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperFormat === '58mm'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              58mm (Mobile POS)
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('80mm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperFormat === '80mm'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              80mm (Desktop Kasir)
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Paper Container */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 flex justify-center bg-slate-950/60 rounded-xl p-2 my-2 border border-slate-800">
          <div
            id="thermal-receipt-printable"
            className={`bg-white text-slate-900 font-mono transition-all duration-200 p-4 shadow-xl border border-slate-300 rounded ${
              paperFormat === '58mm' ? 'w-[280px] text-[10.5px]' : 'w-[360px] text-[12px]'
            }`}
          >
            {/* Header Thermal */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
              <div className="font-black text-sm tracking-wider">{depoName}</div>
              <div className="text-[9px] text-slate-600 leading-tight">{depoAddress}</div>
              <div className="text-[9px] text-slate-600">Hotline: {depoPhone}{profile.nib ? ` • NIB: ${profile.nib}` : ''}</div>
            </div>

            {/* Invoice Meta */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">NO. FAKTUR:</span>
                <span className="font-extrabold text-slate-900">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WAKTU:</span>
                <span className="font-bold">{waktuCetak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PELANGGAN:</span>
                <span className="font-black text-right max-w-[65%] truncate">
                  {order.customerName}
                </span>
              </div>
              {order.residentialDetail && (
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>ALAMAT:</span>
                  <span className="text-right max-w-[70%] leading-tight">
                    {order.residentialDetail}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">SUPIR / ARMADA:</span>
                <span className="font-bold text-right truncate">
                  {order.driver || 'Kurir Armada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">JENIS / SKEMA:</span>
                <span className="font-bold">
                  {order.gallonScheme || 'Tukar Galon'}{order.isSpotSale ? ' (Spot Kanvas)' : ''}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="font-bold text-[10px] uppercase text-slate-600 border-b border-dotted border-slate-300 pb-0.5">
                RINCIAN ITEM (GALON / DUS):
              </div>
              <div className="font-semibold text-slate-800 leading-relaxed text-[11px] whitespace-pre-line">
                {order.items}
              </div>
              <div className="flex justify-between text-[10px] pt-1">
                <span>Total Muatan Galon:</span>
                <span className="font-bold">{order.totalGalon || 0} Galon</span>
              </div>
            </div>

            {/* Financial & Payment Method */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
              <div className="flex justify-between items-center text-sm font-black">
                <span>TOTAL BAYAR:</span>
                <span className="text-base font-black">
                  Rp {order.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span className="text-slate-600">METODE BAYAR:</span>
                <span className="font-bold">
                  {order.paymentStatus === 'Lunas' ? 'LUNAS (Tunai/QRIS)' : 'TEMPO / BON TOKO'}
                </span>
              </div>
              {order.depositAmount ? (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Titipan Uang Deposit:</span>
                  <span>Rp {order.depositAmount.toLocaleString('id-ID')}</span>
                </div>
              ) : null}
            </div>

            {/* Empty Gallon Return (Tabung Kosong Kembali) */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 bg-slate-50/80 p-1.5 rounded">
              <div className="font-bold text-[10px] uppercase text-slate-700">
                PENCATATAN RETUR TABUNG KOSONG:
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span>Galon Kosong Kembali:</span>
                <span className="font-black text-slate-900">{returnGallons} Galon (Tukar Fisik)</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Hutang / Selisih Tabung:</span>
                <span className={debtGallons > 0 ? 'font-bold text-red-600' : 'font-bold text-slate-700'}>
                  {debtGallons > 0 ? `${debtGallons} Galon Belum Kembali` : 'Lengkap (0 Galon)'}
                </span>
              </div>
              {order.damagedItemsNote && (
                <div className="text-[9.5px] text-red-600 font-semibold pt-0.5">
                  Retur Rusak: {order.damagedItemsNote}
                </div>
              )}
            </div>

            {/* Two Signatures (Penerima & Driver) */}
            <div className="pt-3 pb-1 grid grid-cols-2 gap-2 text-center text-[9px] text-slate-600">
              <div>
                <div className="mb-8">Tanda Terima Toko,</div>
                <div className="border-b border-slate-400 mx-3 pb-0.5 font-bold text-slate-900">
                  ( {order.podRecipientName || order.customerName.slice(0, 15)} )
                </div>
              </div>
              <div>
                <div className="mb-8">Kurir / Supir Depo,</div>
                <div className="border-b border-slate-400 mx-3 pb-0.5 font-bold text-slate-900">
                  ( {order.driver.split(' ')[0] || 'Driver'} )
                </div>
              </div>
            </div>

            {/* Footer Thermal */}
            <div className="text-center pt-2 text-[8.5px] text-slate-500 space-y-0.5 border-t border-dotted border-slate-300 mt-1">
              <div>*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</div>
              <div className="font-semibold text-slate-700">Rekening Transfer: {profile.bankName} {profile.bankAccount} (a/n {profile.bankHolder})</div>
              <div>Simpan struk ini sebagai bukti transaksi & retur tabung yang sah</div>
              <div className="font-bold text-[8px] text-slate-400">JACS LOGISTICS SYSTEM • 2026</div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 border-t border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-all active:scale-95"
              title="Salin teks nota ke clipboard"
            >
              {isCopied ? '✅ Tersalin' : '📋 Salin Teks'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol [📲 Kirim Nota WA ke Pelanggan] */}
            <button
              type="button"
              onClick={handleSendWA}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-[0_0_14px_rgba(16,185,129,0.4)] cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>📲 Kirim Nota WA ke Pelanggan</span>
            </button>

            {/* Tombol [🖨️ Cetak Struk / Nota Thermal] */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.45)] cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>🖨️ Cetak Struk ({paperFormat})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
