import React, { useState } from 'react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl: string;
  onUpdateLogoUrl: (newUrl: string) => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  isOpen,
  onClose,
  logoUrl,
  onUpdateLogoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sop' | 'logo_setting'>('profile');
  const [inputUrl, setInputUrl] = useState(logoUrl);
  const [saveToast, setSaveToast] = useState(false);
  const [testImgError, setTestImgError] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setInputUrl(logoUrl);
    setTestImgError(false);
  }, [logoUrl, isOpen]);

  if (!isOpen) return null;

  const handleSaveLogo = () => {
    const trimmed = inputUrl.trim();
    onUpdateLogoUrl(trimmed);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleResetToDefaultLogo = () => {
    setInputUrl('/logo-jacs.svg');
    onUpdateLogoUrl('/logo-jacs.svg');
    setTestImgError(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleClearLogo = () => {
    setInputUrl('');
    onUpdateLogoUrl('');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-900 [body.light-theme_&]:bg-white border-2 border-cyan-500/40 [body.light-theme_&]:border-slate-300 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden [body.light-theme_&]:text-slate-800 animate-scaleIn">
        
        {/* Modal Header */}
        <div className="p-3.5 px-4 bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-b border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-blue-600 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-950 [body.light-theme_&]:bg-white rounded-[6px] flex items-center justify-center">
                <i className="fa-solid fa-circle-info text-cyan-400 [body.light-theme_&]:text-cyan-700 text-sm"></i>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 leading-none">
                Tentang Aplikasi &amp; Developer
              </h3>
              <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-0.5">
                OmniFlow Hub • DISTRIBUTION &amp; FLEET LOGISTICS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white [body.light-theme_&]:text-slate-500 [body.light-theme_&]:hover:text-slate-900 hover:bg-slate-800 [body.light-theme_&]:hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 px-4 bg-slate-950/40 [body.light-theme_&]:bg-slate-100/70 border-b border-slate-800 [body.light-theme_&]:border-slate-200 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-id-card text-xs"></i>
            <span>Profil Developer</span>
          </button>

          <button
            onClick={() => setActiveTab('sop')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sop'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-book-bookmark text-xs"></i>
            <span>Panduan SOP Operasional</span>
          </button>

          <button
            onClick={() => setActiveTab('logo_setting')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logo_setting'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-palette text-xs"></i>
            <span>Setelan URL Logo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
          
          {/* TAB 1: Profil Developer & Aplikasi */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Hero Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 [body.light-theme_&]:from-slate-50 [body.light-theme_&]:to-white border border-slate-800 [body.light-theme_&]:border-slate-300 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-md">
                {/* Logo Display */}
                <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 p-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center shrink-0">
                  {inputUrl && !testImgError ? (
                    <img
                      src={inputUrl}
                      alt="JacS Enterprise Logo"
                      onError={() => setTestImgError(true)}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 to-blue-600 p-0.5 flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[10px] flex flex-col items-center justify-center">
                        <span className="text-xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">
                          JacS
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 [body.light-theme_&]:bg-cyan-100 [body.light-theme_&]:text-cyan-800 font-mono text-[10px] font-bold border border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Developed by JacS Enterprise • v2.0 Pro Edition</span>
                  </div>
                  <h2 className="text-xl font-black text-white [body.light-theme_&]:text-slate-900 leading-tight">
                    OmniFlow Hub
                  </h2>
                  <p className="text-xs font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700 font-mono tracking-wide uppercase">
                    DISTRIBUTION &amp; FLEET LOGISTICS
                  </p>
                  <p className="text-[11px] text-slate-300 [body.light-theme_&]:text-slate-700 leading-relaxed pt-1">
                    Platform orkestrasi distribusi multi-produk (Air RO/Mineral, FMCG Sembako, Homecare, dan Non-FMCG), manajemen perputaran wadah/aset fisik terpadu, serta sistem komando armada logistik yang dikembangkan oleh <strong className="text-white [body.light-theme_&]:text-slate-900 font-bold">JacS Enterprise</strong>.
                  </p>
                </div>
              </div>

              {/* Detail Spesifikasi & Fitur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-cyan-400 [body.light-theme_&]:text-cyan-700 flex items-center gap-1.5">
                    <i className="fa-solid fa-code text-xs"></i>
                    Arsitektur &amp; Keamanan
                  </span>
                  <p className="text-[11px] text-slate-300 [body.light-theme_&]:text-slate-600 leading-relaxed">
                    Dibangun dengan arsitektur mutakhir React 18 SPA, TypeScript strict typing, Tailwind CSS neon cyber theme, modul offline-ready dengan sinkronisasi Google Sheets / Google Apps Script.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-400 [body.light-theme_&]:text-amber-700 flex items-center gap-1.5">
                    <i className="fa-solid fa-certificate text-xs"></i>
                    Hak Cipta &amp; Lisensi
                  </span>
                  <p className="text-[11px] text-slate-300 [body.light-theme_&]:text-slate-600 leading-relaxed">
                    © 2026 JacS Enterprise. Hak Cipta Dilindungi Undang-Undang. Dirancang khusus untuk efisiensi distribusi depo modern dan manajemen rute armada lapangan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Panduan Singkat SOP Operasional */}
          {activeTab === 'sop' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 [body.light-theme_&]:bg-cyan-50 [body.light-theme_&]:text-cyan-900 [body.light-theme_&]:border-cyan-300 flex items-center gap-2">
                <i className="fa-solid fa-lightbulb text-cyan-400 text-sm"></i>
                <span className="text-[11px] font-bold">
                  Panduan 4 Pilar Standar Operasional Prosedur (SOP) OmniFlow Hub
                </span>
              </div>

              {/* SOP Step 1 */}
              <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-white [body.light-theme_&]:text-slate-900 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[11px] font-black">1</span>
                  <span>SOP Buka Kasir & Sesi Operasional Depo (07:00 WIB)</span>
                </div>
                <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 pl-7 leading-relaxed">
                  Petugas kasir memastikan kas modal kembalian telah siap di laci, mengaktifkan status depo, serta mengecek antrean order B2C/B2B yang masuk sebelum memulai transaksi walk-in maupun pengiriman armada.
                </p>
              </div>

              {/* SOP Step 2 */}
              <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-white [body.light-theme_&]:text-slate-900 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-11px font-black">2</span>
                  <span>SOP Tukar Tabung & Transaksi POS Kasir</span>
                </div>
                <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 pl-7 leading-relaxed">
                  Periksa kondisi fisik galon kosong (retur) dari pembeli. Jika jumlah tabung kosong kurang dari pesanan, tentukan resolusi: <em>Beli Tabung Baru</em>, <em>Pinjam Deposit Tabung</em>, atau <em>Hutang Tabung Bon</em>. Transaksi yang selesai otomatis mereset keranjang belanja dan mencetak struk thermal.
                </p>
              </div>

              {/* SOP Step 3 */}
              <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-white [body.light-theme_&]:text-slate-900 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-11px font-black">3</span>
                  <span>SOP Kirim Armada & Pengambilan Tugas Driver (POD)</span>
                </div>
                <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 pl-7 leading-relaxed">
                  Driver mengklaim order di portal supir lapangan, mengantar galon sesuai rute GPS, dan wajib menarik tabung kosong milik depo di lokasi pelanggan. Driver mengunggah foto serah terima (Proof of Delivery / POD) untuk menyelesaikan tugas.
                </p>
              </div>

              {/* SOP Step 4 */}
              <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-white [body.light-theme_&]:text-slate-900 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-11px font-black">4</span>
                  <span>SOP Tutup Buku Harian & Rekonsiliasi Kas (17:00 WIB)</span>
                </div>
                <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600 pl-7 leading-relaxed">
                  Tepat pukul 17:00 WIB, admin membuka modul <strong>Tutup Buku Harian</strong>, memvalidasi uang setoran fisik dari supir, menghitung kas riil kasir, memeriksa saldo piutang tempo, serta mengunci laporan omzet harian.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Konfigurasi URL Logo */}
          {activeTab === 'logo_setting' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 flex flex-col sm:flex-row items-center gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-slate-900 [body.light-theme_&]:bg-white border-2 border-dashed border-cyan-400/60 p-1 flex items-center justify-center shrink-0 shadow-sm">
                  {inputUrl && !testImgError ? (
                    <img
                      src={inputUrl}
                      alt="Logo Preview"
                      onError={() => setTestImgError(true)}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-500 to-blue-600 p-0.5 flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 [body.light-theme_&]:bg-white rounded-[6px] flex flex-col items-center justify-center">
                        <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 font-mono">
                          JacS
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-white [body.light-theme_&]:text-slate-900 block">
                    Pratinjau Logo Header Sidebar
                  </span>
                  <p className="text-[11px] text-slate-400 [body.light-theme_&]:text-slate-600">
                    Logo ini akan langsung tampil di Header Sidebar Kiri Atas dengan styling <code className="font-mono text-cyan-400 text-[10px]">w-10 h-10 object-contain rounded-lg</code>.
                  </p>
                  {testImgError && (
                    <span className="text-[10px] text-rose-400 font-bold block">
                      ⚠️ Gambar tidak dapat dimuat dari URL ini, fallback badge "JacS" akan digunakan.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white [body.light-theme_&]:text-slate-900 mb-1">
                  Masukkan Link URL Gambar Logo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      setTestImgError(false);
                    }}
                    placeholder="Contoh: https://i.imgur.com/... atau link Cloudinary / Google Drive"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveLogo}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Simpan Logo</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 mt-1">
                  Mendukung format gambar PNG, WebP, JPG, atau SVG publik.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                <button
                  type="button"
                  onClick={handleResetToDefaultLogo}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-300 [body.light-theme_&]:text-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-left text-cyan-400"></i>
                  <span>Gunakan Logo JacS Enterprise Bawaan (/logo-jacs.svg)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLogo}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-rose-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-trash-can text-rose-400"></i>
                  <span>Kosongkan URL (Tampilkan Inisial Badge "JacS")</span>
                </button>
              </div>

              {saveToast && (
                <div className="p-2 px-3 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <span>Konfigurasi logo berhasil disimpan ke penyimpanan lokal aplikasi!</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 px-4 bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border-t border-slate-800 [body.light-theme_&]:border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-blue-500"></span>
            <span>JacS Enterprise © 2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
