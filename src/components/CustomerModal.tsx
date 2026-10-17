import React, { useState } from 'react';
import { CustomerMasterItem, CustomerType, StoreZone } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: CustomerMasterItem, andAddToMap?: boolean) => void;
  defaultCategory?: 'Pangkalan' | 'Toko Kelontong' | 'Rumah Tangga';
  defaultZone?: StoreZone;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  defaultCategory,
  defaultZone = 'Rayon Utara',
}) => {
  // Category selection: 'Pangkalan' | 'Toko Kelontong' | 'Rumah Tangga'
  const [categoryChoice, setCategoryChoice] = useState<'Pangkalan' | 'Toko Kelontong' | 'Rumah Tangga'>(
    defaultCategory || 'Toko Kelontong'
  );

  // Common Fields
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('08');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [zone, setZone] = useState<StoreZone>(defaultZone);
  const [initialEmptyGallonDebt, setInitialEmptyGallonDebt] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(3000000);
  const [syncToMap, setSyncToMap] = useState<boolean>(true);

  // B2C Specific
  const [clusterName, setClusterName] = useState('');
  const [blockNumber, setBlockNumber] = useState('');
  const [rtRw, setRtRw] = useState('');

  // Reset or initialize on open
  React.useEffect(() => {
    if (isOpen) {
      if (defaultCategory) setCategoryChoice(defaultCategory);
      if (defaultZone) setZone(defaultZone);
    }
  }, [isOpen, defaultCategory, defaultZone]);

  if (!isOpen) return null;

  const isHousehold = categoryChoice === 'Rumah Tangga';
  const customerType: CustomerType = isHousehold ? 'B2C' : 'B2B';
  const priceTier = categoryChoice === 'Pangkalan' ? 'Pangkalan' : categoryChoice === 'Toko Kelontong' ? 'Toko' : 'Eceran';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama Toko / Nama Pelanggan wajib diisi!');
      return;
    }
    if (!phone.trim() || phone.trim() === '08') {
      alert('Nomor WhatsApp / HP wajib diisi!');
      return;
    }

    const newId = customerType === 'B2B'
      ? `CUST-B2B-${Math.floor(100 + Math.random() * 900)}`
      : `CUST-B2C-${Math.floor(100 + Math.random() * 900)}`;

    const fullAddress = isHousehold
      ? (address || `${clusterName || 'Perumahan'} ${blockNumber ? 'Blok ' + blockNumber : ''} ${rtRw ? 'RT/RW ' + rtRw : ''}`).trim()
      : address.trim();

    const newCustomer: CustomerMasterItem = {
      id: newId,
      type: customerType,
      name: name.trim(),
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim(),
      address: fullAddress || 'Subang Kota, Jawa Barat',
      landmark: landmark.trim() || undefined,
      zone,
      priceTier,
      emptyGallonDebt: Number(initialEmptyGallonDebt) || 0,
      currentReceivable: 0,
      creditLimit: isHousehold ? 0 : Number(creditLimit) || 0,
      b2bCategory: categoryChoice === 'Pangkalan' ? 'Agen / Pangkalan' : categoryChoice === 'Toko Kelontong' ? 'Toko Kelontong' : undefined,
      ...(isHousehold ? {
        clusterName: clusterName.trim() || undefined,
        blockNumber: blockNumber.trim() || undefined,
        rtRw: rtRw.trim() || undefined,
      } : {}),
      lastTransactionDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastTransactionAmount: 0,
    };

    onSaveCustomer(newCustomer, syncToMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 [body.light-theme_&]:bg-white border-2 border-sky-400/50 [body.light-theme_&]:border-sky-300 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-900 border-t-[4px] border-t-sky-500">
        {/* Header */}
        <div className="p-3.5 px-4 bg-slate-950/80 [body.light-theme_&]:bg-sky-50/80 border-b border-slate-800 [body.light-theme_&]:border-sky-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-700 flex items-center justify-center text-sm font-bold border border-sky-400/40 shadow-[0_0_10px_rgba(14,165,233,0.35)]">
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900 leading-tight">
                Pendaftaran Master Pelanggan Baru
              </h3>
              <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                Tersimpan langsung ke database Master Pelanggan, Kasir POS, & Peta Sebaran Toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-lg bg-slate-800 [body.light-theme_&]:bg-slate-100 text-slate-400 hover:text-white [body.light-theme_&]:hover:text-slate-900 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* Segment Selector: Pangkalan vs Toko Kelontong vs Rumah Tangga */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 [body.light-theme_&]:text-slate-600 uppercase tracking-wider mb-1.5">
              Kategori Pelanggan *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Pangkalan', 'Toko Kelontong', 'Rumah Tangga'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryChoice(cat)}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold cursor-pointer transition-all text-center ${
                    categoryChoice === cat
                      ? cat === 'Pangkalan'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-900 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                        : cat === 'Toko Kelontong'
                        ? 'bg-sky-500/25 border-sky-400 text-sky-200 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-900 shadow-[0_0_12px_rgba(14,165,233,0.35)]'
                        : 'bg-emerald-500/25 border-emerald-400 text-emerald-200 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-900 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-800/70 [body.light-theme_&]:bg-slate-100 border-slate-700 [body.light-theme_&]:border-slate-300 text-slate-400 [body.light-theme_&]:text-slate-600 hover:border-slate-500'
                  }`}
                >
                  <i
                    className={`text-xs ${
                      cat === 'Pangkalan'
                        ? 'fa-solid fa-warehouse'
                        : cat === 'Toko Kelontong'
                        ? 'fa-solid fa-store'
                        : 'fa-solid fa-house-chimney'
                    }`}
                  ></i>
                  <span className="text-[11px] font-extrabold">{cat}</span>
                  <span className="text-[8.5px] font-normal opacity-80">
                    {cat === 'Pangkalan'
                      ? 'Tier 1 (Rp 18.500)'
                      : cat === 'Toko Kelontong'
                      ? 'Tier 2 (Rp 19.500)'
                      : 'Tier 3 (Rp 21.000)'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields: General */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                {isHousehold ? 'Nama Pelanggan / Warga *' : 'Nama Toko / Nama Pangkalan *'}
              </label>
              <input
                type="text"
                required
                placeholder={isHousehold ? 'Cth: Bpk. Gunawan Wibisono' : 'Cth: Toko Berkah Mandiri'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                {isHousehold ? 'Nama Pasangan / PIC Penerima' : 'Nama Pemilik / PIC Toko'}
              </label>
              <input
                type="text"
                placeholder={isHousehold ? 'Cth: Ibu Dewi Ratna' : 'Cth: H. Ahmad Fauzi'}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400 font-medium"
              />
            </div>
          </div>

          {/* Row 2: WhatsApp & Zona/Rayon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                No. WhatsApp / HP (Wajib Notif) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="0812-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400 pl-8"
                />
                <i className="fa-brands fa-whatsapp text-emerald-400 absolute left-2.5 top-2.5 text-xs"></i>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Zona / Rayon Distribusi *
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as StoreZone)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400 cursor-pointer font-semibold text-xs"
              >
                <option value="Rayon Utara">Rayon Utara (Pagaden, Kalijati, Dawuan)</option>
                <option value="Rayon Selatan">Rayon Selatan (Jalancagak, Ciater, Cisalak)</option>
                <option value="Residensial">Residensial (Perumahan Kota Subang)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Alamat Lengkap & Patokan */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
              Alamat Lengkap *
            </label>
            <input
              type="text"
              required
              placeholder="Cth: Jl. Raya Pagaden Barat No. 88, Subang"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 [body.light-theme_&]:text-slate-700 mb-1">
                Titik Patokan / Landmark
              </label>
              <input
                type="text"
                placeholder="Cth: Sebelah Masjid Al-Ikhlas / Samping Alfamart"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 [body.light-theme_&]:border-sky-300 text-white [body.light-theme_&]:text-slate-900 focus:outline-none focus:border-sky-400 text-xs"
              />
            </div>

            {/* Saldo Awal Tabung Dipinjam */}
            <div>
              <label className="block text-[10.5px] font-bold text-amber-300 [body.light-theme_&]:text-amber-800 mb-1">
                Saldo Awal Tabung Dipinjam (Hutang Galon)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={initialEmptyGallonDebt}
                  onChange={(e) => setInitialEmptyGallonDebt(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 font-mono font-bold rounded-lg bg-slate-800 [body.light-theme_&]:bg-white border border-amber-500/50 [body.light-theme_&]:border-amber-400 text-amber-300 [body.light-theme_&]:text-amber-800 focus:outline-none text-xs"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-semibold">
                  Tabung
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Tabung kosong depo yang sudah dibawa/dipinjam sebelum registrasi
              </p>
            </div>
          </div>

          {/* B2C Specific Fields: Cluster, Blok, RT/RW */}
          {isHousehold && (
            <div className="p-2.5 rounded-xl bg-slate-950/50 [body.light-theme_&]:bg-emerald-50/50 border border-emerald-500/30 grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mb-0.5">
                  Cluster / Perumahan
                </label>
                <input
                  type="text"
                  placeholder="Cth: Cluster Pasadena"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 text-xs text-white [body.light-theme_&]:text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mb-0.5">
                  Blok / No. Rumah
                </label>
                <input
                  type="text"
                  placeholder="Cth: Blok C3 No. 15"
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 text-xs text-white [body.light-theme_&]:text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mb-0.5">
                  RT / RW
                </label>
                <input
                  type="text"
                  placeholder="Cth: RT 02 / RW 09"
                  value={rtRw}
                  onChange={(e) => setRtRw(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-800 [body.light-theme_&]:bg-white border border-slate-700 text-xs text-white [body.light-theme_&]:text-slate-900"
                />
              </div>
            </div>
          )}

          {/* B2B Specific: Plafon Kredit Tempo */}
          {!isHousehold && (
            <div className="p-2.5 rounded-xl bg-slate-950/50 [body.light-theme_&]:bg-amber-50/50 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-amber-300 [body.light-theme_&]:text-amber-800 text-[11px] block">
                  Plafon Kredit Bon / Tempo (Limit Piutang)
                </span>
                <span className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                  Batas maksimal nota hutang sebelum otomatis terkunci di kasir
                </span>
              </div>
              <div className="w-36">
                <input
                  type="number"
                  step="500000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 font-mono font-bold rounded bg-slate-800 [body.light-theme_&]:bg-white border border-amber-500/40 text-amber-300 [body.light-theme_&]:text-amber-900 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Sync Checkbox to Maps CRM */}
          <div className="p-2 px-3 rounded-lg bg-cyan-950/20 [body.light-theme_&]:bg-cyan-50 border border-cyan-500/30 flex items-center justify-between cursor-pointer" onClick={() => setSyncToMap(!syncToMap)}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={syncToMap}
                onChange={(e) => setSyncToMap(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-[11px] font-bold text-cyan-300 [body.light-theme_&]:text-cyan-900 block leading-tight">
                  Sinkronkan ke Peta & Radar Toko (Maps CRM)
                </span>
                <span className="text-[9.5px] text-slate-400 [body.light-theme_&]:text-slate-600">
                  Otomatis muncul di peta rute supir & kanvasing lapangan
                </span>
              </div>
            </div>
            <i className="fa-solid fa-map-location-dot text-cyan-400 text-sm"></i>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-sky-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 [body.light-theme_&]:bg-slate-200 [body.light-theme_&]:text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-[0_0_12px_rgba(14,165,233,0.35)] cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <i className="fa-solid fa-user-check"></i>
              Simpan Master Pelanggan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
