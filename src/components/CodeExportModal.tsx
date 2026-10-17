import React, { useState, useEffect } from 'react';
import { GAS_STYLES_HTML, GAS_APP_HTML, GAS_CODE_GS } from '../data/gasCode';
import {
  getGasWebhookUrl,
  saveGasWebhookUrl,
  getLastSyncTime,
  triggerGasWebhook,
  testGasWebhookConnection,
  downloadBackupJSON,
  downloadDailyCSV,
  isValidGasUrl,
  SyncStatus,
} from '../utils/cloudSync';
import {
  OrderItem,
  ReceivableItem,
  ArmadaItem,
  EmployeeItem,
  InboundDropItem,
  PurchaseOrderItem,
  ProductMasterItem,
  GallonStock,
} from '../types';
import {
  Code,
  Copy,
  Check,
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  Send,
  Activity,
  Download,
  FileSpreadsheet,
  FileJson,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: OrderItem[];
  receivables?: ReceivableItem[];
  armadaList?: ArmadaItem[];
  employees?: EmployeeItem[];
  inboundDrops?: InboundDropItem[];
  purchaseOrders?: PurchaseOrderItem[];
  products?: ProductMasterItem[];
  gallonCirculation?: GallonStock[];
  syncStatus?: SyncStatus;
  onSyncSuccess?: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  receivables = [],
  armadaList = [],
  employees = [],
  inboundDrops = [],
  purchaseOrders = [],
  products = [],
  gallonCirculation = [],
  syncStatus = 'offline',
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'guide' | 'backup' | 'html'>('codegs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook Configuration State
  const [webhookUrlInput, setWebhookUrlInput] = useState<string>('');
  const [isTestingSync, setIsTestingSync] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string>('');
  const [isSendingTestData, setIsSendingTestData] = useState<boolean>(false);
  const [testLog, setTestLog] = useState<{
    success: boolean;
    statusCode: number | string;
    responseType: string;
    message: string;
    rawResponse?: string;
    timestamp: string;
    payloadSent: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedUrl = getGasWebhookUrl();
      setWebhookUrlInput(savedUrl);
      setLastSyncDisplay(getLastSyncTime());
      setSyncFeedback({ type: null, message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleSendTestData = async () => {
    const url = webhookUrlInput.trim() || getGasWebhookUrl();
    if (!url) {
      setSyncFeedback({
        type: 'error',
        message: 'Silakan tempelkan Google Apps Script Web App URL terlebih dahulu sebelum mengirim tes.',
      });
      return;
    }

    if (!isValidGasUrl(url)) {
      setSyncFeedback({
        type: 'error',
        message: 'Format URL tidak valid. Pastikan URL diawali dengan https://script.google.com/macros/s/.../exec',
      });
      return;
    }

    saveGasWebhookUrl(url);
    setIsSendingTestData(true);
    setSyncFeedback({ type: null, message: '' });

    try {
      const result = await testGasWebhookConnection(url);
      setTestLog(result);
      if (result.success) {
        setSyncFeedback({
          type: 'success',
          message: '🟢 Data Transaksi Tes Berhasil Dikirim ke Google Sheets via JSON Webhook (text/plain)!',
        });
        setLastSyncDisplay(getLastSyncTime());
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncFeedback({
          type: 'error',
          message: `Gagal mengirim data tes: ${result.message}`,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: `Terjadi kesalahan saat pengujian: ${err?.message || String(err)}`,
      });
    } finally {
      setIsSendingTestData(false);
    }
  };

  const handleSaveAndConnectDatabase = async () => {
    const url = webhookUrlInput.trim();
    if (!url) {
      setSyncFeedback({
        type: 'error',
        message: 'Silakan tempelkan Google Apps Script Web App URL terlebih dahulu.',
      });
      return;
    }

    if (!isValidGasUrl(url)) {
      setSyncFeedback({
        type: 'error',
        message: 'Format URL tidak valid. Pastikan URL diawali dengan https://script.google.com/macros/s/.../exec',
      });
      return;
    }

    // Simpan URL yang valid ke penyimpanan lokal
    saveGasWebhookUrl(url);
    setIsTestingSync(true);
    setSyncFeedback({ type: null, message: '' });

    try {
      // Sinkronisasi data transaksi serta stok ke spreadsheet
      const res = await triggerGasWebhook(
        'sync_all',
        {
          orders,
          receivables,
          armada: armadaList,
          employees,
          inboundDrops,
          purchaseOrders,
          products,
          gallonCirculation,
          settlement: {
            date: new Date().toLocaleDateString('id-ID'),
            status: 'TERKUNCI & SAH',
            waktuSync: new Date().toLocaleTimeString('id-ID'),
          },
          summary: {
            totalOrders: orders.length,
            totalReceivables: receivables.length,
            activeArmada: armadaList.length,
            totalInboundDrops: inboundDrops.length,
            totalProducts: products.length,
            totalGallonStock: gallonCirculation.reduce((acc, g) => acc + g.filled + g.empty, 0),
          },
        },
        url
      );

      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: '🟢 Database Google Sheets Berhasil Terhubung! Data transaksi serta stok telah disinkronkan ke Spreadsheet.',
        });
        setLastSyncDisplay(getLastSyncTime());
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message || 'Gagal tersambung ke URL Web App. Periksa izin deployment Anda.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Terjadi kesalahan jaringan saat menghubungkan database Google Sheets.',
      });
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleDownloadJSON = () => {
    downloadBackupJSON({
      orders,
      receivables,
      armadaList,
      employees,
      inboundDrops,
      purchaseOrders,
      settlement: {
        date: new Date().toLocaleDateString('id-ID'),
        status: 'TERKUNCI & SAH',
      },
    });
  };

  const handleDownloadCSV = () => {
    downloadDailyCSV({
      orders,
      receivables,
    });
  };

  const isConfigured = Boolean(webhookUrlInput.trim());

  return (
    <div
      id="gas-code-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="gas-code-modal"
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col h-[94vh] max-h-[94vh] overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/30 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Code className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  INTEGRASI GOOGLE APPS SCRIPT (GAS) & CLOUD SYNC
                </h3>
                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold border border-cyan-400/40">
                  SPREADSHEET ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hubungkan JacS DepoHub Pro dengan Google Sheets secara langsung melalui Webhook Apps Script
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TOP CONFIGURATION CARD: WEBHOOK URL & SYNC CONTROLS */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 bg-slate-950/95 border-b border-slate-800 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                {syncStatus === 'synced' ? (
                  <Cloud className="w-4 h-4 text-emerald-400" />
                ) : (
                  <CloudOff className="w-4 h-4 text-amber-400" />
                )}
                <span>Koneksi Database Google Sheets (Apps Script):</span>
              </span>

              {/* Status Badge */}
              <span
                id="modal-gas-status-badge"
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                ></span>
                <span>{syncStatus === 'synced' ? '🟢 Skrip GAS: Online' : '🟡 Skrip GAS: Offline'}</span>
              </span>
            </div>

            {lastSyncDisplay && (
              <span className="text-[10.5px] font-mono text-slate-400">
                Terakhir sync: <strong className="text-cyan-300">{lastSyncDisplay}</strong>
              </span>
            )}
          </div>

          {/* Webhook Input Row */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                Google Apps Script Web App URL
              </span>
              <span className="text-[10px] font-normal text-slate-400 font-mono hidden sm:inline">
                Deploy &gt; New deployment &gt; Web app &gt; Anyone
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  id="input-gas-webhook-url"
                  value={webhookUrlInput}
                  onChange={(e) => {
                    setWebhookUrlInput(e.target.value);
                    if (syncFeedback.message) setSyncFeedback({ type: null, message: '' });
                  }}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              {/* Tombol [Simpan & Hubungkan Database] */}
              <button
                type="button"
                id="btn-save-connect-database"
                disabled={isTestingSync}
                onClick={handleSaveAndConnectDatabase}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                title="Simpan Web App URL dan hubungkan database Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                <span>{isTestingSync ? 'Menyinkronkan...' : 'Simpan & Hubungkan Database'}</span>
              </button>

              {/* Tombol [Kirim Data Tes ke Sheet] */}
              <button
                type="button"
                id="btn-send-test-data"
                disabled={isSendingTestData}
                onClick={handleSendTestData}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                title="Kirim 1 baris transaksi contoh ke Google Spreadsheet"
              >
                <Send className={`w-3.5 h-3.5 ${isSendingTestData ? 'animate-spin' : ''}`} />
                <span>{isSendingTestData ? 'Mengirim Tes...' : 'Kirim Data Tes ke Sheet'}</span>
              </button>

              {/* Tombol Cadangan Manual */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="Download Cadangan JSON Lengkap"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="Download Rekap CSV Harian"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {syncFeedback.message && (
            <div
              className={`p-2 rounded-lg text-[11px] font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
              }`}
            >
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="flex-1">{syncFeedback.message}</span>
            </div>
          )}

          {/* Debug Log Transparan Pengiriman Webhook */}
          {testLog && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2 text-xs font-mono animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-white">
                  <Activity className={`w-4 h-4 ${testLog.success ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span>Status Respon Pengiriman Webhook:</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  testLog.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {testLog.statusCode}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Waktu Kirim:</span>{' '}
                  <span className="text-cyan-300 font-bold">{testLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400">Format Payload:</span>{' '}
                  <span className="text-amber-300 font-bold">{testLog.responseType}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px]">Data Payload JSON yang Dikirim (text/plain;charset=utf-8):</span>
                <div className="p-2 mt-1 rounded bg-slate-950 border border-slate-800 text-[10.5px] text-slate-300 overflow-x-auto space-y-0.5 max-h-28 overflow-y-auto">
                  <div>• <strong>action:</strong> {testLog.payloadSent.action}</div>
                  <div>• <strong>orderId:</strong> <span className="text-cyan-400">{testLog.payloadSent.orderId}</span></div>
                  <div>• <strong>customerName:</strong> {testLog.payloadSent.customerName}</div>
                  <div>• <strong>items:</strong> {testLog.payloadSent.items}</div>
                  <div>• <strong>totalAmount:</strong> Rp {Number(testLog.payloadSent.totalAmount).toLocaleString('id-ID')}</div>
                  <div>• <strong>paymentMethod:</strong> {testLog.payloadSent.paymentMethod}</div>
                  <div>• <strong>cashier:</strong> {testLog.payloadSent.cashier}</div>
                </div>
              </div>

              <div className="pt-1 text-[10.5px]">
                <span className="text-slate-400">Respon Server / Status Log:</span>
                <p className="mt-0.5 text-slate-200 bg-slate-950/60 p-2 rounded border border-slate-800 break-words">
                  {testLog.rawResponse || testLog.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION */}
        {/* ========================================================================= */}
        <div className="px-5 py-2 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('codegs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'codegs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Source Code GAS (Code.gs)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Panduan Pasang & Deploy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor & Impor Cadangan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'html'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>HTML Standalone (Styles & App)</span>
            </button>
          </div>

          {/* Quick Copy Button for Code.gs */}
          {activeTab === 'codegs' && (
            <button
              type="button"
              onClick={() => handleCopy(GAS_CODE_GS, 'codegs')}
              className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_12px_rgba(6,182,212,0.35)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              {copiedKey === 'codegs' ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Code.gs Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Seluruh Code.gs</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-950 font-sans text-xs text-slate-300">
          {/* TAB 1: CODE.GS */}
          {activeTab === 'codegs' && (
            <div className="space-y-3">
              {/* Sheet Capabilities Overview Banner */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11.5px]">
                    <span className="text-sm">📦</span>
                    <span>1. Sheet 'Pesanan'</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Mencatat seluruh transaksi order reguler kasir dan spot supir kanvasing: No. Faktur, Tanggal, Nama Toko, Supir, Produk, Total Bayar, Status Antar, Status Pembayaran, Metode Bayar.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11.5px]">
                    <span className="text-sm">💳</span>
                    <span>2. Sheet 'Piutang'</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Monitoring buku tempo toko otomatis: ID Piutang, No. Faktur, Toko/Mitra, Nominal Tagihan, Tanggal Transaksi, Jatuh Tempo (7 Hari), Status Piutang, Galon Dipinjam.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11.5px]">
                    <span className="text-sm">🔒</span>
                    <span>3. Sheet 'RekapShift'</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Hasil rekonsiliasi audit tutup buku (17:00 WIB): Tanggal, Total Kas Masuk, Tunai Kasir, QRIS/Transfer, Setoran Supir, Pelunasan Tempo, Target Brankas, Retur Galon Armada & Selisih.
                  </p>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden font-mono text-[11px]">
                <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-cyan-400">Code.gs (Google Apps Script)</span>
                  <span>JavaScript / Apps Script V8 Engine</span>
                </div>
                <pre className="p-3.5 whitespace-pre overflow-x-auto leading-relaxed text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 max-h-[50vh]">
                  {GAS_CODE_GS}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN DEPLOY WEB APP */}
          {activeTab === 'guide' && (
            <div className="max-w-3xl mx-auto space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Buka Google Sheets & Apps Script Editor</span>
                </h4>
                <p className="text-slate-300 pl-8">
                  Buka Google Sheets baru atau lembar kerja depo yang Anda gunakan, beri nama misalnya{' '}
                  <strong className="text-white">"Database Depo Tirta Mandiri"</strong>. Lalu pada menu atas, klik{' '}
                  <strong className="text-cyan-300">Ekstensi &gt; Apps Script</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Tempelkan Source Code (Code.gs)</span>
                </h4>
                <p className="text-slate-300 pl-8">
                  Hapus fungsi bawaan <code className="text-amber-300">myFunction()</code> di file{' '}
                  <code className="text-cyan-300">Code.gs</code>, lalu klik tombol{' '}
                  <strong className="text-cyan-300">[Salin Seluruh Code.gs]</strong> dari tab sebelumnya dan tempelkan. Klik ikon Disket (Simpan).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Deploy Sebagai Aplikasi Web (Penting!)</span>
                </h4>
                <div className="pl-8 space-y-2 text-slate-300">
                  <p>
                    1. Di pojok kanan atas Apps Script, klik tombol biru{' '}
                    <strong className="text-white">Terapkan (Deploy) &gt; Penerapan baru (New deployment)</strong>.
                  </p>
                  <p>
                    2. Pada ikon gerigi jenis penerapan, pilih <strong className="text-cyan-300">Aplikasi Web</strong>.
                  </p>
                  <p>
                    3. Beri deskripsi: <code className="text-slate-300 font-mono">JacS DepoHub Pro Sync v1</code>.
                  </p>
                  <p>
                    4. Jalankan sebagai: <strong className="text-white">Saya (email Anda)</strong>.
                  </p>
                  <p>
                    5. <strong className="text-amber-400">PENTING (Akses):</strong> Pilih{' '}
                    <strong className="text-amber-300">"Siapa saja" (Anyone)</strong>. Ini wajib agar browser di komputer kasir & smartphone supir dapat mengirim data tanpa kendala login popup.
                  </p>
                  <p>
                    6. Klik <strong className="text-emerald-400">Terapkan</strong>, berikan izin akses Google Spreadsheet jika diminta.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                    4
                  </span>
                  <span>Salin URL Web App ke JacS DepoHub Pro</span>
                </h4>
                <p className="text-slate-300 pl-8">
                  Salin URL Web App yang berakhiran <code className="text-cyan-300 font-mono">/exec</code>, tempelkan pada inputan di atas, lalu klik{' '}
                  <strong className="text-cyan-300">[Tes Koneksi / Sync Sekarang]</strong>. Indikator status akan langsung berubah menjadi hijau{' '}
                  <strong className="text-emerald-400">🟢 Tersinkron Cloud</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP OFFLINE JSON & CSV */}
          {activeTab === 'backup' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg">
                    <FileJson className="w-5 h-5 font-black" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Cadangan Lengkap Format JSON</h4>
                    <p className="text-slate-400 text-[11px]">
                      Menyimpan seluruh data operasional depo (Semua transaksi order, kartu piutang toko, inventaris galon armada, dan data karyawan).
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Total: {orders.length} Order • {receivables.length} Kartu Piutang
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadJSON}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Backup Data ke JSON</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg">
                    <FileSpreadsheet className="w-5 h-5 font-black" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Ekspor Rekap Harian Format CSV (Excel)</h4>
                    <p className="text-slate-400 text-[11px]">
                      File spreadsheet terstruktur (dilengkapi UTF-8 BOM agar rapi saat dibuka di Microsoft Excel). Berisi 3 tabel utama: Faktur Pesanan, Buku Piutang Aktif, dan Hasil Rekonsiliasi Tutup Buku Shift.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Kompatibel dengan Microsoft Excel, Google Sheets, LibreOffice Calc
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>📊 Ekspor CSV Harian</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HTML STANDALONE */}
          {activeTab === 'html' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-sans text-xs">
                <p className="text-slate-300">
                  Untuk pengguna yang ingin menjalankan seluruh tampilan antarmuka JacS DepoHub Pro langsung di dalam Google Apps Script HtmlService (tanpa server hosting eksternal), Anda dapat menyalin file HTML di bawah:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(GAS_STYLES_HTML, 'styles')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'styles' ? 'Styles.html Tersalin!' : 'Salin Styles.html'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(GAS_APP_HTML, 'app')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'app' ? 'App.html Tersalin!' : 'Salin App.html'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Sinkronisasi otomatis bekerja di latar belakang setiap ada transaksi baru atau tutup buku.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
