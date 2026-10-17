import React, { useState, useRef, useEffect } from 'react';
import { getDepoProfile } from '../utils/depoProfile';

// Dynamic default message templates for WhatsApp notification
const DEFAULT_TEMPLATES: Record<'tagihan' | 'kirim' | 'galon_kosong', string> = {
  tagihan: `Halo Yth. *{nama_pelanggan}*,

Kami dari *{nama_depo}* ingin menginformasikan rincian tagihan faktur tempo berjalan:
- Total Tagihan: *Rp {nominal_tagihan}*
- Tabung Galon Beredar: *{jumlah_galon} Tabung*
- Jatuh Tempo: *Hari ini*

Pembayaran dapat ditransfer ke:
*{nomor_rekening}* a/n *{nama_depo}*

Mohon konfirmasi jika telah melakukan pembayaran. Terima kasih atas kerja samanya! 🙏💧`,

  kirim: `Halo Yth. *{nama_pelanggan}*,

Order air mineral Anda dari *{nama_depo}* saat ini sedang dalam perjalanan menuju lokasi Anda:
- Muatan: *{jumlah_galon} Galon 19L Original*
- Driver Pengantar: *{driver_armada}*

Mohon siapkan tabung galon kosong untuk ditukar saat armada tiba. Terima kasih! 🚚💧`,

  galon_kosong: `Halo Yth. *{nama_pelanggan}*,

Salam dari *{nama_depo}*.
Berdasarkan audit kartu tabung, saat ini tercatat ada *{jumlah_galon} Tabung Galon Kosong* di lokasi Anda. Armada ({driver_armada}) kami dijadwalkan untuk penarikan tabung kosong hari ini.

Mohon bantuannya untuk menyiapkan tabung kosong tersebut. Terima kasih atas kerja samanya! 🙏💧`,
};

const PLACEHOLDER_TAGS = [
  { tag: '{nama_pelanggan}', label: 'Nama Pelanggan', icon: 'fa-user' },
  { tag: '{nominal_tagihan}', label: 'Nominal Tagihan', icon: 'fa-money-bill-wave' },
  { tag: '{jumlah_galon}', label: 'Jumlah Galon', icon: 'fa-bottle-water' },
  { tag: '{driver_armada}', label: 'Driver & Armada', icon: 'fa-truck' },
  { tag: '{nama_depo}', label: 'Nama Depo', icon: 'fa-store' },
  { tag: '{nomor_rekening}', label: 'Nomor Rekening', icon: 'fa-credit-card' },
];

export const WhatsAppView: React.FC = () => {
  // Parameters
  const [targetPhone, setTargetPhone] = useState('6281234567890');
  const [customerName, setCustomerName] = useState('Pangkalan Berkah Sejahtera');
  const [invoiceAmount, setInvoiceAmount] = useState('1.450.000');
  const [gallonsCount, setGallonsCount] = useState('45');
  const [driverName, setDriverName] = useState('Pak Bambang (Carry B 9421 KDA)');
  
  // Dynamic Depo & Bank account settings (synced with Executive Manager profile & localStorage)
  const [depoName, setDepoName] = useState(() => {
    return localStorage.getItem('wa_setting_depo_name') || getDepoProfile().name || 'JacS DepoHub Subang';
  });
  const [bankAccount, setBankAccount] = useState(() => {
    const prof = getDepoProfile();
    return localStorage.getItem('wa_setting_bank_account') || `${prof.bankName} ${prof.bankAccount} (a/n ${prof.bankHolder})`;
  });

  const [templateType, setTemplateType] = useState<'tagihan' | 'kirim' | 'galon_kosong'>('tagihan');
  
  // Custom template texts per type (loaded from localStorage or defaults)
  const [templates, setTemplates] = useState<Record<'tagihan' | 'kirim' | 'galon_kosong', string>>(() => {
    return {
      tagihan: localStorage.getItem('wa_tpl_tagihan') || DEFAULT_TEMPLATES.tagihan,
      kirim: localStorage.getItem('wa_tpl_kirim') || DEFAULT_TEMPLATES.kirim,
      galon_kosong: localStorage.getItem('wa_tpl_galon_kosong') || DEFAULT_TEMPLATES.galon_kosong,
    };
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active template text
  const currentTemplate = templates[templateType];

  // Save active template to localStorage
  const handleSaveTemplate = () => {
    localStorage.setItem(`wa_tpl_${templateType}`, currentTemplate);
    localStorage.setItem('wa_setting_depo_name', depoName);
    localStorage.setItem('wa_setting_bank_account', bankAccount);
    setSaveStatus('Template berhasil disimpan!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Reset active template to default
  const handleResetTemplate = () => {
    const defaultText = DEFAULT_TEMPLATES[templateType];
    localStorage.removeItem(`wa_tpl_${templateType}`);
    setTemplates((prev) => ({
      ...prev,
      [templateType]: defaultText,
    }));
    setSaveStatus('Format template dikembalikan ke default!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Insert placeholder tag into textarea at cursor position
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setTemplates((prev) => ({
        ...prev,
        [templateType]: prev[templateType] + tag,
      }));
      return;
    }

    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const oldText = currentTemplate;
    const newText = oldText.substring(0, startPos) + tag + oldText.substring(endPos);

    setTemplates((prev) => ({
      ...prev,
      [templateType]: newText,
    }));

    // Re-focus and update cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + tag.length, startPos + tag.length);
    }, 10);
  };

  // Real-time message renderer replacing dynamic tags
  const renderMessageText = (tpl: string): string => {
    return tpl
      .replace(/\{nama_pelanggan\}/g, customerName || '[Nama Pelanggan]')
      .replace(/\{nominal_tagihan\}/g, invoiceAmount || '0')
      .replace(/\{jumlah_galon\}/g, gallonsCount || '0')
      .replace(/\{driver_armada\}/g, driverName || '[Driver & Armada]')
      .replace(/\{nama_depo\}/g, depoName || 'JacS DepoHub')
      .replace(/\{nomor_rekening\}/g, bankAccount || '[Nomor Rekening]');
  };

  const messageText = renderMessageText(currentTemplate);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWA = () => {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  // Quick preset loader for realistic testing
  const handleLoadSample = (sample: 'b2b' | 'retail' | 'agen') => {
    if (sample === 'b2b') {
      setCustomerName('Toko Kelontong Berkah (Ibu Siti)');
      setTargetPhone('6281298765432');
      setInvoiceAmount('875.000');
      setGallonsCount('35');
      setDriverName('Pak Agus (Carry Box D 8821 AB)');
    } else if (sample === 'agen') {
      setCustomerName('Agen Air Minum Tirta Mandiri');
      setTargetPhone('6285712345678');
      setInvoiceAmount('2.950.000');
      setGallonsCount('120');
      setDriverName('Supriadi (GrandMax Pickup B 9012 KDA)');
    } else {
      setCustomerName('Ibu Rahmawati (Perum Graha Indah)');
      setTargetPhone('6287890123456');
      setInvoiceAmount('38.000');
      setGallonsCount('2');
      setDriverName('Rian (Motor Roda Tiga Viar)');
    }
  };

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden [body.light-theme_&]:text-slate-800">
      {/* Top Banner - Neutral & Dynamic Branding */}
      <div className="glass-panel p-2.5 px-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-700 flex items-center justify-center font-bold text-sm">
            <i className="fa-brands fa-whatsapp"></i>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-2 leading-none">
              <span>Integrasi Notifikasi WhatsApp ({depoName || 'JacS DepoHub'})</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-700 font-bold border border-emerald-500/30">
                Live Dynamic Template
              </span>
            </h3>
            <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5">
              Kustomisasi format redaksi narasi pesan WhatsApp dengan placeholder variabel otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-[11px] font-bold text-emerald-400 [body.light-theme_&]:text-emerald-700 animate-fadeIn flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <i className="fa-solid fa-circle-check"></i>
              {saveStatus}
            </span>
          )}
          <span className="text-[10.5px] font-bold px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            WhatsApp Gateway Siap
          </span>
        </div>
      </div>

      {/* 2 Column Layout - Scrollable & Fits Screen Height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        
        {/* Left Column: Template Editor & Parameters (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-col justify-between overflow-y-auto scrollbar-thin shadow-sm gap-2.5">
          
          <div className="space-y-2.5">
            {/* Template Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
              <div className="flex items-center gap-1 text-xs font-bold text-white [body.light-theme_&]:text-slate-900">
                <i className="fa-solid fa-file-pen text-cyan-400"></i>
                <span>Pilih Jenis Template Pesan:</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setTemplateType('tagihan')}
                  className={`py-1 px-2.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    templateType === 'tagihan'
                      ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-sm'
                      : 'bg-slate-900 [body.light-theme_&]:bg-slate-100 text-slate-400 [body.light-theme_&]:text-slate-600 border-slate-800 [body.light-theme_&]:border-slate-200 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-receipt text-[11px]"></i>
                  <span>Tagihan Tempo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('kirim')}
                  className={`py-1 px-2.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    templateType === 'kirim'
                      ? 'bg-sky-500 text-white font-extrabold border-sky-400 shadow-sm'
                      : 'bg-slate-900 [body.light-theme_&]:bg-slate-100 text-slate-400 [body.light-theme_&]:text-slate-600 border-slate-800 [body.light-theme_&]:border-slate-200 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-truck-fast text-[11px]"></i>
                  <span>Armada Di Jalan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('galon_kosong')}
                  className={`py-1 px-2.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    templateType === 'galon_kosong'
                      ? 'bg-purple-600 text-white font-extrabold border-purple-400 shadow-sm'
                      : 'bg-slate-900 [body.light-theme_&]:bg-slate-100 text-slate-400 [body.light-theme_&]:text-slate-600 border-slate-800 [body.light-theme_&]:border-slate-200 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-arrow-rotate-left text-[11px]"></i>
                  <span>Tarik Galon Kosong</span>
                </button>
              </div>
            </div>

            {/* Quick Insert Placeholder Tags */}
            <div className="bg-slate-900/80 [body.light-theme_&]:bg-slate-50 p-2.5 rounded-xl border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-300 [body.light-theme_&]:text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-tags text-cyan-400 text-xs"></i>
                  Klik untuk Sisipkan Variabel Dinamis (Placeholder Tag):
                </span>
                <span className="text-[9.5px] text-slate-400 font-mono">Disisipkan di posisi kursor</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDER_TAGS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    className="px-2 py-1 rounded-md text-[10.5px] font-mono font-bold bg-slate-950 [body.light-theme_&]:bg-white border border-cyan-500/40 [body.light-theme_&]:border-cyan-600/40 text-cyan-300 [body.light-theme_&]:text-cyan-800 hover:bg-cyan-500/20 [body.light-theme_&]:hover:bg-cyan-50 transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                    title={`Klik untuk menyisipkan ${item.tag}`}
                  >
                    <i className={`fa-solid ${item.icon} text-[10px] text-cyan-400 [body.light-theme_&]:text-cyan-600`}></i>
                    <span>{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                  <i className="fa-solid fa-keyboard text-emerald-400 text-xs"></i>
                  <span>Kustomisasi Format / Template Redaksi Pesan:</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentTemplate.length} karakter
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={currentTemplate}
                onChange={(e) => {
                  const val = e.target.value;
                  setTemplates((prev) => ({
                    ...prev,
                    [templateType]: val,
                  }));
                }}
                rows={7}
                placeholder="Ketik format template pesan WhatsApp di sini..."
                className="w-full p-2.5 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border-2 border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-sans text-xs focus:outline-none focus:border-cyan-500 leading-relaxed transition-all shadow-inner scrollbar-thin"
              />
            </div>

            {/* Parameter Input Fields Grid */}
            <div className="bg-slate-900/60 [body.light-theme_&]:bg-slate-50 p-2.5 rounded-xl border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5">
                  <i className="fa-solid fa-sliders text-amber-400 text-xs"></i>
                  <span>Nilai Parameter Dinamis Pesan:</span>
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-400">Contoh:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('b2b')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-800 hover:text-white cursor-pointer font-bold"
                  >
                    B2B Toko
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('agen')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-800 hover:text-white cursor-pointer font-bold"
                  >
                    Agen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('retail')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 [body.light-theme_&]:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-800 hover:text-white cursor-pointer font-bold"
                  >
                    Eceran
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    Nama Pelanggan {'{nama_pelanggan}'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Pangkalan Berkah Sejahtera"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    No. WhatsApp Tujuan
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="6281234567890"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    Nominal Tagihan (Rp) {'{nominal_tagihan}'}
                  </label>
                  <input
                    type="text"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="1.450.000"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    Jumlah Galon {'{jumlah_galon}'}
                  </label>
                  <input
                    type="text"
                    value={gallonsCount}
                    onChange={(e) => setGallonsCount(e.target.value)}
                    placeholder="45"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    Driver & Armada {'{driver_armada}'}
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Pak Bambang (Carry B 9421 KDA)"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    Nama Depo {'{nama_depo}'}
                  </label>
                  <input
                    type="text"
                    value={depoName}
                    onChange={(e) => setDepoName(e.target.value)}
                    placeholder="JacS DepoHub"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 text-xs focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[10.5px] mb-0.5">
                    Nomor Rekening {'{nomor_rekening}'}
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="BCA 8830-1928-11"
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons for Template Customization */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>Simpan Redaksi Template</span>
            </button>

            <button
              type="button"
              onClick={handleResetTemplate}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 [body.light-theme_&]:text-slate-700 font-bold text-xs border border-slate-700 [body.light-theme_&]:border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              title="Kembalikan format narasi template ini ke pengaturan bawaan standar"
            >
              <i className="fa-solid fa-arrow-rotate-left"></i>
              <span>Reset ke Default</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Preview (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-3 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 flex flex-col justify-between overflow-hidden shadow-sm">
          
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Header Pratinjau */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs shadow-sm">
                  <i className="fa-brands fa-whatsapp font-bold"></i>
                </div>
                <div>
                  <h4 className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs leading-none">
                    Pratinjau Pesan WhatsApp
                  </h4>
                  <span className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 font-mono">
                    Realtime Terisi Otomatis
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 [body.light-theme_&]:text-emerald-700 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                To: {targetPhone}
              </span>
            </div>

            {/* Bubble Chat WhatsApp Look (Authentic Design) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 rounded-2xl bg-[#0b141a] [body.light-theme_&]:bg-[#efeae2] border border-slate-800 [body.light-theme_&]:border-slate-300 flex flex-col gap-2 shadow-inner scrollbar-thin">
              
              {/* Message Meta Info */}
              <div className="text-center my-0.5">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 [body.light-theme_&]:bg-white/80 text-slate-400 [body.light-theme_&]:text-slate-600 shadow-xs border border-slate-800 [body.light-theme_&]:border-slate-200">
                  Hari Ini • Pesan Terenkripsi End-to-End
                </span>
              </div>

              {/* Chat Bubble */}
              <div className="self-end max-w-[94%] bg-[#005c4b] [body.light-theme_&]:bg-[#d9fdd3] text-[#e9edef] [body.light-theme_&]:text-[#111b21] p-3 rounded-2xl rounded-tr-xs shadow-md border border-[#005c4b]/50 [body.light-theme_&]:border-[#d9fdd3]/50 text-xs leading-relaxed font-sans space-y-2">
                <div className="whitespace-pre-line select-text">
                  {messageText}
                </div>

                <div className="flex items-center justify-end gap-1 text-[9.5px] text-emerald-200/70 [body.light-theme_&]:text-slate-500 font-mono pt-1">
                  <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  <i className="fa-solid fa-check-double text-sky-300 [body.light-theme_&]:text-sky-500 text-[10px]"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Below Preview */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-200 [body.light-theme_&]:text-slate-800 bg-slate-800 [body.light-theme_&]:bg-slate-100 hover:bg-slate-700 [body.light-theme_&]:hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 [body.light-theme_&]:border-slate-300 active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-copy"></i>
                  <span>Salin Pesan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenWA}
              className="flex-1 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <i className="fa-brands fa-whatsapp text-sm font-bold"></i>
              <span>Kirim ke WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
