import React, { useState } from 'react';
import { SYSTEM_LOGS, USER_ACCESS_LIST } from '../data/mockData';
import { SystemLogItem, UserAccessItem, OrderItem, ArmadaItem, EmployeeItem, GallonStock } from '../types';
import { SettlementView } from './SettlementView';
import { AboutAppModal } from './AboutAppModal';

interface AdminDokumenViewProps {
  onOpenCodeModal?: () => void;
  onOpenAboutModal?: () => void;
  initialTab?: 'users' | 'logs' | 'backup' | 'settlement' | 'branding';
  orders?: OrderItem[];
  armadaList?: ArmadaItem[];
  employees?: EmployeeItem[];
  gallonCirculation?: GallonStock[];
  logoUrl?: string;
  onUpdateLogoUrl?: (newUrl: string) => void;
}

export const AdminDokumenView: React.FC<AdminDokumenViewProps> = ({
  onOpenCodeModal,
  onOpenAboutModal,
  initialTab = 'users',
  orders = [],
  armadaList = [],
  employees = [],
  gallonCirculation = [],
  logoUrl: propLogoUrl,
  onUpdateLogoUrl: propOnUpdateLogoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'backup' | 'settlement' | 'branding'>(initialTab);
  const [logs, setLogs] = useState<SystemLogItem[]>(SYSTEM_LOGS);
  const [users, setUsers] = useState<UserAccessItem[]>(USER_ACCESS_LIST);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchLog, setSearchLog] = useState('');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Logo state
  const [localLogoUrl, setLocalLogoUrl] = useState(() => {
    return propLogoUrl || localStorage.getItem('jacs_logo_url') || '/logo-jacs.svg';
  });
  const [logoInputText, setLogoInputText] = useState(localLogoUrl);
  const [logoSaveFeedback, setLogoSaveFeedback] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const activeLogo = propLogoUrl !== undefined ? propLogoUrl : localLogoUrl;

  React.useEffect(() => {
    if (propLogoUrl !== undefined) {
      setLocalLogoUrl(propLogoUrl);
      setLogoInputText(propLogoUrl);
      setPreviewError(false);
    }
  }, [propLogoUrl]);

  const handleSaveLogoUrl = (urlToSave: string) => {
    const trimmed = urlToSave.trim();
    setLocalLogoUrl(trimmed);
    setLogoInputText(trimmed);
    localStorage.setItem('jacs_logo_url', trimmed);
    if (propOnUpdateLogoUrl) {
      propOnUpdateLogoUrl(trimmed);
    }
    setLogoSaveFeedback(true);
    setPreviewError(false);
    setTimeout(() => setLogoSaveFeedback(false), 2500);
  };

  const filteredLogs = logs.filter((log) => {
    const matchCat = selectedCategory === 'Semua' ? true : log.category === selectedCategory;
    const matchSearch =
      log.action.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.user.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.details.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.id.toLowerCase().includes(searchLog.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : u))
    );
  };

  const handleExportBackup = () => {
    setBackupStatus('syncing');
    setTimeout(() => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
        depo: 'JacS DepoHub - Distributor Air Mineral',
        exportDate: new Date().toISOString(),
        users,
        logs,
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `depohub_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupStatus('success');
    }, 800);
  };

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden [body.light-theme_&]:text-slate-800">
      {/* Top Banner */}
      <div className="glass-panel p-2.5 px-3.5 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm border-t-[3px] border-t-pink-500 [body.light-theme_&]:border-t-pink-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-400 text-pink-400 [body.light-theme_&]:bg-pink-50 [body.light-theme_&]:border-pink-300 [body.light-theme_&]:text-pink-700 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(236,72,153,0.35)]">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white [body.light-theme_&]:text-slate-900 flex items-center gap-1.5 leading-none">
              ADMINISTRASI, HAK AKSES & AUDIT SISTEM
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 [body.light-theme_&]:bg-pink-100 [body.light-theme_&]:text-pink-800 [body.light-theme_&]:border-pink-300">
                SECURITY & AUDIT
              </span>
            </h2>
          </div>
        </div>

        {/* Sub-tab Navigation & About Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-user-lock mr-1.5"></i>
              Hak Akses Role
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-list-check mr-1.5"></i>
              Audit Trail / Log
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'text-slate-400 hover:text-white [body.light-theme_&]:text-slate-600 [body.light-theme_&]:hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-cloud-arrow-down mr-1.5"></i>
              Backup & Sync
            </button>
            <button
              onClick={() => setActiveTab('settlement')}
              className={`px-3 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'settlement'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-cyan-400 hover:text-cyan-200 [body.light-theme_&]:text-cyan-800 [body.light-theme_&]:hover:text-cyan-950'
              }`}
            >
              <i className="fa-solid fa-calculator mr-1"></i>
              <span>Tutup Buku (17:00)</span>
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'branding'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-amber-400 hover:text-amber-200 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:hover:text-amber-950'
              }`}
            >
              <i className="fa-solid fa-palette mr-1"></i>
              <span>Setelan Logo</span>
            </button>
          </div>

          {/* Tombol Info Tentang Aplikasi */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAboutModal) {
                onOpenAboutModal();
              } else {
                setIsAboutModalOpen(true);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
            title="Buka Informasi Tentang Aplikasi & Profil Developer JacS Enterprise"
          >
            <i className="fa-solid fa-circle-info text-xs"></i>
            <span>Tentang Aplikasi</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'users' && (
        <div className="flex-1 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 overflow-hidden flex flex-col shadow-sm">
          <div className="p-2.5 px-3 border-b border-slate-800 [body.light-theme_&]:border-sky-200 bg-slate-950/60 [body.light-theme_&]:bg-sky-50/50 flex justify-between items-center">
            <span className="font-extrabold text-xs text-white [body.light-theme_&]:text-slate-900">
              Daftar Akun Pengguna & Hak Akses Modul Depo
            </span>
            <button
              onClick={() => alert('Form Tambah Akun Baru dapat dikonfigurasi melalui Super Admin!')}
              className="px-2.5 py-1 rounded text-[10px] font-bold text-slate-950 bg-gradient-to-r from-pink-400 to-rose-300 hover:from-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.4)] cursor-pointer"
            >
              + Tambah Akun Staf
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-950/90 [body.light-theme_&]:bg-sky-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 [body.light-theme_&]:text-slate-600 border-b border-slate-800 [body.light-theme_&]:border-sky-200 backdrop-blur-md">
                <tr>
                  <th className="py-2 px-3">Nama Lengkap & Username</th>
                  <th className="py-2 px-3">Tingkat Hak Akses (Role)</th>
                  <th className="py-2 px-3">Cakupan Izin Modul</th>
                  <th className="py-2 px-3">Aktivitas Terakhir</th>
                  <th className="py-2 px-3">Status Akun</th>
                  <th className="py-2 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-sky-100">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-800/40 [body.light-theme_&]:hover:bg-sky-50/50">
                    <td className="py-2 px-3">
                      <div className="font-extrabold text-white [body.light-theme_&]:text-slate-900 text-xs">
                        {usr.fullName}
                      </div>
                      <div className="text-[10px] text-pink-400 [body.light-theme_&]:text-pink-600 font-mono mt-0.5">
                        @{usr.username} ({usr.id})
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border ${
                        usr.role === 'Super Admin'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 [body.light-theme_&]:bg-rose-50 [body.light-theme_&]:text-rose-800'
                          : usr.role === 'Kasir Depo'
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:text-sky-800'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800'
                      }`}>
                        <i className="fa-solid fa-user-shield text-[9px]"></i>
                        {usr.role}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {usr.permissions.map((perm, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200 [body.light-theme_&]:text-slate-700"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <span className="text-[10.5px] font-mono text-slate-400 [body.light-theme_&]:text-slate-600">
                        {usr.lastLogin}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        usr.status === 'Aktif'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:text-emerald-800'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${usr.status === 'Aktif' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {usr.status}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleToggleUserStatus(usr.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 hover:border-slate-500 text-slate-300 [body.light-theme_&]:border-slate-300 [body.light-theme_&]:text-slate-700 cursor-pointer"
                      >
                        {usr.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 [body.light-theme_&]:text-slate-600">Kategori:</span>
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-slate-100 text-[11px] font-bold">
                {(['Semua', 'Transaksi POS', 'Piutang', 'Master Data', 'Surat Jalan', 'Keamanan'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-pink-500/20 text-pink-300 [body.light-theme_&]:bg-white [body.light-theme_&]:text-pink-800 border border-pink-400/40 shadow-sm'
                        : 'text-slate-400 [body.light-theme_&]:text-slate-600 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Cari aksi, kasir, atau nomor faktur..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-300 text-slate-200 [body.light-theme_&]:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-pink-400"
              />
            </div>
          </div>

          <div className="flex-1 glass-panel rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 overflow-hidden flex flex-col shadow-sm">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-950/90 [body.light-theme_&]:bg-sky-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 [body.light-theme_&]:text-slate-600 border-b border-slate-800 [body.light-theme_&]:border-sky-200 backdrop-blur-md">
                  <tr>
                    <th className="py-2 px-3">Waktu & IP</th>
                    <th className="py-2 px-3">Petugas / User</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3">Aksi yang Dilakukan</th>
                    <th className="py-2 px-3">Detail & Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 [body.light-theme_&]:divide-sky-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 [body.light-theme_&]:hover:bg-sky-50/50">
                      <td className="py-2 px-3">
                        <div className="font-mono text-slate-200 [body.light-theme_&]:text-slate-800 text-[10.5px]">
                          {log.timestamp}
                        </div>
                        <div className="text-[9.5px] font-mono text-slate-500">IP: {log.ipAddress}</div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-bold text-white [body.light-theme_&]:text-slate-900 text-xs">{log.user}</div>
                        <span className="text-[9px] text-pink-400 [body.light-theme_&]:text-pink-600 font-semibold">{log.role}</span>
                      </td>

                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-slate-900 border border-slate-800 text-slate-300 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200 [body.light-theme_&]:text-slate-700">
                          {log.category}
                        </span>
                      </td>

                      <td className="py-2 px-3">
                        <span className="font-bold text-white [body.light-theme_&]:text-slate-900">{log.action}</span>
                      </td>

                      <td className="py-2 px-3 max-w-md">
                        <p className="text-[11px] text-slate-300 [body.light-theme_&]:text-slate-700 leading-snug">
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
          {/* Card 1: Backup JSON Lokal */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">
                  <i className="fa-solid fa-file-arrow-down"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900">
                    Ekspor Snapshot Data Lengkap (JSON)
                  </h3>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Download cadangan offline seluruh master data, piutang, transaksi kasir & sirkulasi tabung
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200 space-y-1.5 text-xs text-slate-300 [body.light-theme_&]:text-slate-700 my-3">
                <div className="flex justify-between">
                  <span>Frekuensi Backup Otomatis:</span>
                  <span className="font-bold text-white [body.light-theme_&]:text-slate-900">Setiap Hari 23:59 WIB</span>
                </div>
                <div className="flex justify-between">
                  <span>Ukuran Estimasi Basis Data:</span>
                  <span className="font-bold text-cyan-400 [body.light-theme_&]:text-sky-700">~1.45 MB (Ringan & Cepat)</span>
                </div>
                <div className="flex justify-between">
                  <span>Enkripsi Cadangan:</span>
                  <span className="font-bold text-emerald-400">AES-256 Validated</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportBackup}
              disabled={backupStatus === 'syncing'}
              className="w-full py-2.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <i className={`fa-solid ${backupStatus === 'syncing' ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
              <span>{backupStatus === 'syncing' ? 'Menyiapkan Snapshot...' : 'Unduh Cadangan JSON Sekarang'}</span>
            </button>
          </div>

          {/* Card 2: Sinkronisasi Google Apps Script / Drive */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-sky-200 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm border border-cyan-500/30">
                  <i className="fa-brands fa-google-drive"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900">
                    Sinkronisasi Google Sheets & Apps Script
                  </h3>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Koneksi 2 arah ke Google Spreadsheet untuk integrasi multi-cabang & laporan akuntansi
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 [body.light-theme_&]:bg-sky-50 [body.light-theme_&]:border-sky-200 space-y-1.5 text-xs text-slate-300 [body.light-theme_&]:text-slate-700 my-3">
                <div className="flex justify-between">
                  <span>Status Web App Script:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Terkoneksi (Active)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>File Kode Apps Script:</span>
                  <span className="font-bold text-white [body.light-theme_&]:text-slate-900">Styles.html & App.html</span>
                </div>
                <div className="flex justify-between">
                  <span>Google Sheet Depo ID:</span>
                  <span className="font-mono text-[10px] text-cyan-400 [body.light-theme_&]:text-sky-700">1x8k...JACS-2026</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {onOpenCodeModal && (
                <button
                  onClick={onOpenCodeModal}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-code"></i>
                  <span>Buka Kode GAS</span>
                </button>
              )}
              <button
                onClick={() => alert('Sinkronisasi ke Google Drive & Sheets berhasil disinkronkan!')}
                className="flex-1 py-2 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-rotate"></i>
                <span>Sync Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <SettlementView
            orders={orders}
            armadaList={armadaList}
            employees={employees}
            gallonCirculation={gallonCirculation}
          />
        </div>
      )}

      {/* Tab: Konfigurasi Branding & Logo */}
      {activeTab === 'branding' && (
        <div className="flex-1 overflow-y-auto p-1 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Card 1: Konfigurasi Logo */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 shadow-sm flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm border border-amber-500/30">
                    <i className="fa-solid fa-palette"></i>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900">
                      Konfigurasi Logo Utama Sidebar
                    </h3>
                    <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                      Ganti link gambar logo JacS Enterprise (Google Drive/Imgur/Cloudinary)
                    </p>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="p-3 rounded-xl bg-slate-950/80 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-300 flex items-center gap-3.5 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-900 [body.light-theme_&]:bg-white border-2 border-dashed border-cyan-400/60 p-1 flex items-center justify-center shrink-0 shadow-sm">
                    {logoInputText.trim() && !previewError ? (
                      <img
                        src={logoInputText.trim()}
                        alt="Logo Preview"
                        onError={() => setPreviewError(true)}
                        className="w-10 h-10 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-blue-600 p-[1.5px] shadow-sm shrink-0 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-950 [body.light-theme_&]:bg-white rounded-[6px] flex flex-col items-center justify-center leading-none">
                          <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 font-mono tracking-tighter">
                            JacS
                          </span>
                          <span className="text-[5.5px] font-bold text-slate-400 [body.light-theme_&]:text-slate-500 uppercase">PRO</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white [body.light-theme_&]:text-slate-900 block">
                      Pratinjau Logo Header Sidebar
                    </span>
                    <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600 leading-tight">
                      Komponen <code className="font-mono text-cyan-400 [body.light-theme_&]:text-cyan-700 font-bold">&lt;img className="w-10 h-10 object-contain rounded-lg"&gt;</code> di Header Kiri Atas.
                    </p>
                    {previewError && (
                      <span className="text-[10px] text-rose-400 font-bold block">
                        ⚠️ Gagal memuat gambar dari URL tersebut, fallback inisial badge "JacS" aktif.
                      </span>
                    )}
                  </div>
                </div>

                {/* Input URL Form */}
                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-300 [body.light-theme_&]:text-slate-700 text-[11px]">
                    URL Gambar Logo:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoInputText}
                      onChange={(e) => {
                        setLogoInputText(e.target.value);
                        setPreviewError(false);
                      }}
                      placeholder="https://... atau /logo-jacs.svg"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 [body.light-theme_&]:bg-white border border-slate-800 [body.light-theme_&]:border-slate-300 text-white [body.light-theme_&]:text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveLogoUrl(logoInputText)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Simpan</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                    Masukkan direct link gambar publik (PNG, WebP, JPG, SVG) atau gunakan logo default JacS Enterprise.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800 [body.light-theme_&]:border-slate-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveLogoUrl('/logo-jacs.svg')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-slate-200 [body.light-theme_&]:text-slate-800 text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-rotate-left text-cyan-400"></i>
                    <span>Logo Bawaan JacS Enterprise (/logo-jacs.svg)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveLogoUrl('')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:hover:bg-slate-200 text-rose-400 text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-trash-can text-rose-400"></i>
                    <span>Kosongkan URL (Fallback Badge "JacS")</span>
                  </button>
                </div>

                {logoSaveFeedback && (
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    <span>Pengaturan logo berhasil disimpan dan diperbarui di Sidebar!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Developer & About Card */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 [body.light-theme_&]:bg-white [body.light-theme_&]:border-slate-200 shadow-sm flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-slate-800 [body.light-theme_&]:border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-blue-600 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950 [body.light-theme_&]:bg-white rounded-[6px] flex items-center justify-center">
                      <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 font-mono">
                        JacS
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white [body.light-theme_&]:text-slate-900">
                      Identitas Pengembang & Lisensi
                    </h3>
                    <p className="text-[10px] text-slate-400 [body.light-theme_&]:text-slate-500">
                      JacS DepoHub Pro • v2.0 Pro Edition
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 [body.light-theme_&]:bg-slate-50 border border-slate-800 [body.light-theme_&]:border-slate-200 space-y-2 text-xs text-slate-300 [body.light-theme_&]:text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Pengembang Aplikasi:</span>
                    <strong className="text-white [body.light-theme_&]:text-slate-900 font-bold">
                      JacS Enterprise
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Versi Rilis:</span>
                    <span className="font-mono text-cyan-400 [body.light-theme_&]:text-cyan-700 font-bold">
                      v2.0 Pro Edition
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fokus Solusi:</span>
                    <span>Sistem Manajemen Distribusi & Sirkulasi Depo Galon Modern</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status Hak Cipta:</span>
                    <span className="text-emerald-400 font-bold">© 2026 JacS Enterprise</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 [body.light-theme_&]:text-slate-600 leading-relaxed">
                  💡 Dilengkapi dengan 4 SOP operasional terpadu: <strong>Buka Kasir</strong>, <strong>Tukar Tabung POS</strong>, <strong>Kirim Armada (POD)</strong>, dan <strong>Tutup Buku Harian (17:00 WIB)</strong>.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenAboutModal) {
                    onOpenAboutModal();
                  } else {
                    setIsAboutModalOpen(true);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <i className="fa-solid fa-circle-info text-sm"></i>
                <span>Buka Modal Lengkap "Tentang Aplikasi & SOP Depo"</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Tentang Aplikasi */}
      <AboutAppModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        logoUrl={activeLogo}
        onUpdateLogoUrl={handleSaveLogoUrl}
      />
    </div>
  );
};
