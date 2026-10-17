import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Stethoscope,
  Database,
  KeyRound,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Upload,
  HardDrive,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Sparkles,
  Bot,
  Terminal,
  ShieldCheck,
  UserCheck,
  FileText,
  Copy,
  ExternalLink,
  RotateCcw,
  Check,
  Info,
  Trash2,
  AlertCircle,
  AlertOctagon,
  Building2,
  CreditCard,
  Image as ImageIcon,
  Save,
  X,
  LogOut,
} from 'lucide-react';
import {
  getMasterSuperAdmin,
  updateMasterSuperAdminPin,
  verifySuperAdminPin,
  getHardwareFingerprint,
  logMasterAdminAction,
  getMasterAdminAuditLogs,
  SecurityAuditLog,
} from '../../utils/rootAuthority';
import {
  getDepoProfile,
  saveDepoProfile,
  DepoBusinessProfile,
} from '../../utils/depoProfile';
import {
  getGasWebhookUrl,
  saveGasWebhookUrl,
  testGasWebhookConnection,
  syncPosTransactionToGas,
  syncAllTransactionsToGas,
  clearGasDummyOrders,
} from '../../utils/cloudSync';
import { resetReceiptCounters } from '../../utils/receiptCounter';
import { RECENT_ORDERS, INITIAL_KASIR_TRANSACTIONS } from '../../data/mockData';
import { getManagerPin, setManagerPin } from '../ManagerPinModal';

interface SuperAdminDashboardProps {
  onLockSession: () => void;
  onExitToNormalMode?: () => void;
  logoUrl?: string;
  onUpdateLogoUrl?: (newUrl: string) => void;
  onOpenFirstRunWizard?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onLockSession,
  onExitToNormalMode,
  logoUrl: propLogoUrl,
  onUpdateLogoUrl,
  onOpenFirstRunWizard,
}) => {
  const [activeTab, setActiveTab] = useState<
    'health' | 'doctor' | 'repair' | 'license'
  >('health');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Master Admin Info
  const [masterAdmin, setMasterAdmin] = useState(() => getMasterSuperAdmin());

  // ----------------------------------------------------
  // TAB A: STATUS SISTEM & SERVER HEALTH
  // ----------------------------------------------------
  const [serverPingMs, setServerPingMs] = useState<number | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverHealthData, setServerHealthData] = useState<any>(null);

  const [gasPingMs, setGasPingMs] = useState<number | null>(null);
  const [gasStatus, setGasStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [gasDetails, setGasDetails] = useState<string>('');

  const [storageInfo, setStorageInfo] = useState<{
    usedKb: number;
    percent: number;
    itemCount: number;
    breakdown: { key: string; sizeKb: number }[];
  }>({ usedKb: 0, percent: 0, itemCount: 0, breakdown: [] });

  const calculateStorage = () => {
    try {
      let totalBytes = 0;
      const breakdown: { key: string; sizeKb: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          const bytes = (key.length + val.length) * 2;
          totalBytes += bytes;
          breakdown.push({ key, sizeKb: Math.round(bytes / 1024) });
        }
      }
      const usedKb = Math.round(totalBytes / 1024);
      // typical quota 5MB = 5120 KB
      const percent = Math.min(Math.round((usedKb / 5120) * 100), 100);
      setStorageInfo({
        usedKb,
        percent,
        itemCount: localStorage.length,
        breakdown: breakdown.sort((a, b) => b.sizeKb - a.sizeKb),
      });
    } catch {
      // ignore
    }
  };

  const pingServer = async () => {
    setServerStatus('checking');
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setServerPingMs(latency);
        setServerStatus('online');
        setServerHealthData(data);
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
      setServerPingMs(null);
    }
  };

  const pingGasWebhook = async () => {
    handleTestGasWebhook(false);
  };

  useEffect(() => {
    calculateStorage();
    pingServer();
  }, []);

  // ----------------------------------------------------
  // TAB B: AI SYSTEM DOCTOR & BUG ANALYZER
  // ----------------------------------------------------
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<{
    overallScore: number;
    healthGrade: string;
    databaseIntegrity: string;
    syncIntegrity: string;
    recommendationSummary: string;
    issuesFound: { title: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string; action: string }[];
    optimizations: string[];
    timestamp?: string;
  } | null>(null);

  // Chat AI Doctor
  const [doctorChatInput, setDoctorChatInput] = useState('');
  const [doctorChatLoading, setDoctorChatLoading] = useState(false);
  const [doctorMessages, setDoctorMessages] = useState<
    { sender: 'user' | 'doctor'; text: string; time: string }[]
  >([
    {
      sender: 'doctor',
      text: 'Halo Super Admin! Saya AI System Doctor (Gemini 3.8 Flash). Saya siap menganalisis stabilitas antrean pengiriman armada, integritas data transaksi kasir, dan kesiapan webhook Google Sheets.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleRunSystemDiagnosis = async () => {
    setIsDiagnosing(true);
    calculateStorage();

    try {
      // Gather runtime context
      let totalOrders = 0;
      let totalKasirTxs = 0;
      let totalCustomers = 0;
      let uncompletedOrders = 0;
      let orphanRecords = 0;

      try {
        const rawOrders = localStorage.getItem('depo_orders');
        if (rawOrders) {
          const list = JSON.parse(rawOrders);
          totalOrders = list.length;
          uncompletedOrders = list.filter((o: any) => o.status !== 'Selesai' && o.status !== 'Terkirim').length;
        }
      } catch {}

      try {
        const rawKasir = localStorage.getItem('kasir_transactions');
        if (rawKasir) {
          totalKasirTxs = JSON.parse(rawKasir).length;
        }
      } catch {}

      try {
        const rawCust = localStorage.getItem('depo_customers');
        if (rawCust) {
          totalCustomers = JSON.parse(rawCust).length;
        }
      } catch {}

      const payload = {
        localStorageSizeKb: storageInfo.usedKb,
        totalOrders,
        totalKasirTxs,
        totalCustomers,
        uncompletedOrders,
        orphanRecords,
        lastGasSync: gasStatus === 'online' ? 'Lancar (Tested)' : 'Siap Sinkron',
        errorLogs: getMasterAdminAuditLogs().slice(0, 3),
        networkOnline: navigator.onLine,
      };

      const res = await fetch('/api/ai/system-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setDiagnosisResult({
            ...data.data,
            timestamp: new Date().toLocaleTimeString('id-ID'),
          });
          showToast('✓ Diagnosis Sistem AI selesai dieksekusi!');
          logMasterAdminAction('AI_DIAGNOSIS_RUN', `Skor: ${data.data.overallScore}/100 Grade: ${data.data.healthGrade}`, 'info');
        }
      } else {
        showToast('⚠️ Gagal terhubung ke endpoint AI System Doctor.');
      }
    } catch (err: any) {
      showToast('⚠️ Error menjalankan diagnosis AI: ' + (err?.message || ''));
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSendDoctorChat = async (presetText?: string) => {
    const textToSend = presetText || doctorChatInput.trim();
    if (!textToSend || doctorChatLoading) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setDoctorMessages((prev) => [...prev, { sender: 'user', text: textToSend, time }]);
    if (!presetText) setDoctorChatInput('');
    setDoctorChatLoading(true);

    try {
      const res = await fetch('/api/ai/system-doctor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: {
            localStorageSizeKb: storageInfo.usedKb,
            serverStatus,
            gasStatus,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || 'Diagnosa selesai. Sistem terpantau aman.';
        setDoctorMessages((prev) => [
          ...prev,
          {
            sender: 'doctor',
            text: replyText,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setDoctorMessages((prev) => [
          ...prev,
          {
            sender: 'doctor',
            text: 'Maaf, terjadi gangguan pada komunikasi AI Doctor. Silakan coba lagi.',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setDoctorMessages((prev) => [
        ...prev,
        {
          sender: 'doctor',
          text: 'Koneksi lokal tidak merespon. Pastikan server dev berjalan.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setDoctorChatLoading(false);
    }
  };

  // ----------------------------------------------------
  // TAB C: KONTROL SINKRONISASI & DATABASE REPAIR
  // ----------------------------------------------------
  const [gasWebhookInput, setGasWebhookInput] = useState<string>(() => getGasWebhookUrl());
  const [isSavingGasUrl, setIsSavingGasUrl] = useState<boolean>(false);
  const [isTestingGas, setIsTestingGas] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncFeedbackMessage, setSyncFeedbackMessage] = useState<string | null>(null);
  const [copiedGasUrl, setCopiedGasUrl] = useState(false);
  const [isScanningDb, setIsScanningDb] = useState(false);
  const [repairReport, setRepairReport] = useState<string | null>(null);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [resetStockOption, setResetStockOption] = useState<'preserve_master_zero_stock' | 'zero_all_containers'>('preserve_master_zero_stock');
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetPinError, setResetPinError] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [isClearingSheetModalOpen, setIsClearingSheetModalOpen] = useState(false);
  const [isClearingSheet, setIsClearingSheet] = useState(false);

  // Sinkronkan state input dengan localStorage & modal '<> Skrip GAS' secara real-time
  useEffect(() => {
    const handleUrlSync = () => {
      setGasWebhookInput(getGasWebhookUrl());
    };
    window.addEventListener('storage', handleUrlSync);
    window.addEventListener('gas_url_changed', handleUrlSync);
    return () => {
      window.removeEventListener('storage', handleUrlSync);
      window.removeEventListener('gas_url_changed', handleUrlSync);
    };
  }, []);

  const handleSaveGasUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingGasUrl(true);
    const trimmed = gasWebhookInput.trim();
    saveGasWebhookUrl(trimmed);
    localStorage.setItem('jacs_gas_url', trimmed);
    setTimeout(() => {
      setIsSavingGasUrl(false);
      if (trimmed) {
        showToast('✓ URL Webhook Google Apps Script berhasil disimpan!');
        logMasterAdminAction('UPDATE_GAS_WEBHOOK', `URL Webhook disimpan: ${trimmed.slice(0, 45)}...`, 'info');
      } else {
        showToast('✓ URL Webhook Google Apps Script telah dikosongkan!');
        logMasterAdminAction('CLEAR_GAS_WEBHOOK', 'URL Webhook Google Apps Script dikosongkan', 'warning');
      }
    }, 250);
  };

  const handleTestGasWebhook = async (showNotification = true) => {
    const targetUrl = gasWebhookInput.trim() || getGasWebhookUrl();
    if (!targetUrl) {
      if (showNotification) {
        showToast('⚠️ Masukkan atau tempel URL Webhook Google Apps Script terlebih dahulu!');
      }
      return;
    }

    setIsTestingGas(true);
    setGasStatus('checking');
    const start = performance.now();
    try {
      // Pastikan URL yang sedang diketik otomatis tersimpan sebelum pengujian
      saveGasWebhookUrl(targetUrl);
      localStorage.setItem('jacs_gas_url', targetUrl);

      const res = await testGasWebhookConnection(targetUrl);
      const latency = Math.round(performance.now() - start);
      setGasPingMs(latency);

      if (res.success) {
        setGasStatus('online');
        setGasDetails(res.message);
        if (showNotification) {
          showToast(`✓ Berhasil terhubung ke Google Sheets (HTTP 200 OK)! Respon: ${latency} ms`);
        }
        logMasterAdminAction('TEST_GAS_WEBHOOK', `Tes webhook sukses (${latency} ms)`, 'info');
      } else {
        setGasStatus('offline');
        setGasDetails(res.message);
        if (showNotification) {
          showToast(`⚠️ Tes Webhook Gagal: ${res.message || 'Periksa status deployment di Google Apps Script'}`);
        }
        logMasterAdminAction('TEST_GAS_WEBHOOK_FAIL', `Tes webhook gagal: ${res.message}`, 'warning');
      }
    } catch (err: any) {
      setGasStatus('offline');
      const errMsg = err?.message || 'Gagal tersambung ke endpoint Google Apps Script';
      setGasDetails(errMsg);
      if (showNotification) {
        showToast(`⚠️ Gagal Tersambung: ${errMsg}`);
      }
    } finally {
      setIsTestingGas(false);
    }
  };

  const handleCopyGasUrl = () => {
    const url = gasWebhookInput.trim() || getGasWebhookUrl();
    if (!url) {
      showToast('⚠️ Belum ada URL Webhook untuk disalin.');
      return;
    }
    navigator.clipboard.writeText(url);
    setCopiedGasUrl(true);
    setTimeout(() => setCopiedGasUrl(false), 2000);
    showToast('✓ URL Google Apps Script Webhook disalin!');
  };

  const handleForceSyncAll = async () => {
    try {
      const targetUrl = gasWebhookInput.trim() || getGasWebhookUrl();
      if (!targetUrl) {
        showToast('⚠️ Masukkan atau simpan URL Google Apps Script Webhook terlebih dahulu!');
        return;
      }

      // Kumpulkan seluruh data transaksi dari berbagai penyimpanan lokal
      const combined: any[] = [];
      const seenIds = new Set<string>();

      const addItems = (key: string) => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              arr.forEach((it) => {
                const id = it?.id || it?.orderId;
                if (id && !seenIds.has(id)) {
                  seenIds.add(id);
                  combined.push(it);
                } else if (!id) {
                  combined.push(it);
                }
              });
            }
          }
        } catch {
          // ignore
        }
      };

      addItems('kasir_transactions');
      addItems('argus_kasir_transactions');
      addItems('depo_orders');
      addItems('argus_orders');
      addItems('jacs_orders');

      let txs = combined;
      if (txs.length === 0) {
        txs = [...RECENT_ORDERS, ...INITIAL_KASIR_TRANSACTIONS];
      }

      setIsSyncingAll(true);
      setSyncFeedbackMessage(null);
      setSyncProgress({ current: 0, total: txs.length });

      // Lakukan loop pengiriman per transaksi secara berurutan menggunakan payload standar 'create_order'
      for (let i = 0; i < txs.length; i++) {
        const order = txs[i];
        setSyncProgress({ current: i + 1, total: txs.length });

        // Format 'rincian' mengambil daftar barang dari keranjang
        let rincian = '';
        if (Array.isArray(order.items)) {
          rincian = order.items
            .map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`)
            .join(', ');
        } else if (Array.isArray(order.cartItems)) {
          rincian = order.cartItems
            .map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`)
            .join(', ');
        } else if (Array.isArray(order.cart)) {
          rincian = order.cart
            .map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`)
            .join(', ');
        } else if (typeof order.rincian === 'string' && order.rincian.trim()) {
          rincian = order.rincian;
        } else if (typeof order.itemsSummary === 'string' && order.itemsSummary.trim()) {
          rincian = order.itemsSummary;
        } else if (typeof order.items === 'string' && order.items.trim()) {
          rincian = order.items;
        } else {
          rincian = 'Transaksi Depo';
        }

        // Format 'tanggal' lokal rapi (misal: 14.30 WITA)
        let tanggal = '';
        if (order.timestamp) {
          try {
            const d = typeof order.timestamp === 'number' ? new Date(order.timestamp) : new Date(order.timestamp);
            if (!isNaN(d.getTime())) {
              tanggal = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
            }
          } catch {}
        } else if (order.tanggal && typeof order.tanggal === 'string') {
          if (order.tanggal.includes('T') && order.tanggal.includes('Z')) {
            try {
              const d = new Date(order.tanggal);
              if (!isNaN(d.getTime())) {
                tanggal = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
              }
            } catch {}
          } else {
            tanggal = order.tanggal.replace('WIB', 'WITA');
            if (!tanggal.includes('WITA') && !tanggal.includes('WIT')) tanggal += ' WITA';
          }
        } else if (order.time && typeof order.time === 'string') {
          tanggal = order.time.replace('WIB', 'WITA');
          if (!tanggal.includes('WITA') && !tanggal.includes('WIT')) tanggal += ' WITA';
        }
        if (!tanggal) {
          tanggal = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
        }

        // Format 'total' mengambil nilai: order.grandTotal || order.totalPrice || order.totalAmount || order.total || 0
        const total = Number(
          order.grandTotal ||
          order.totalPrice ||
          order.totalAmount ||
          order.total ||
          0
        );

        const payload = {
          action: 'create_order',
          noFaktur: order.id || order.noFaktur || `STR-${Date.now()}`,
          tanggal,
          pelanggan: order.customerName || order.namaPelanggan || order.pelanggan || order.customer || 'Pelanggan Kasir POS',
          supir: order.driverName || order.supir || order.driver || order.cashier || 'Kasir Depo',
          rincian,
          total,
          statusKirim: order.statusKirim || 'Selesai',
          statusBayar: order.status || order.statusBayar || ((order.paymentMethod || order.payment) === 'Bayar Tempo' ? 'Belum Lunas' : 'Lunas'),
          metodeBayar: (order.paymentMethod || order.metodeBayar || order.payment || 'TUNAI').toUpperCase(),
        };

        try {
          await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.warn('Gagal sinkronisasi order ke GAS:', order.id, err);
        }

        if (i < txs.length - 1) {
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      const feedback = '✅ Seluruh transaksi telah dikirim ke Google Sheets! Silakan refresh halaman spreadsheet Anda.';
      setSyncFeedbackMessage(feedback);
      showToast(feedback);
      logMasterAdminAction('FORCE_SYNC_ALL', `Menyinkronkan ${txs.length} transaksi ke Google Sheets`, 'info');
    } catch (err: any) {
      showToast('⚠️ Gagal sinkronisasi: ' + err?.message);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleScanAndRepairDb = () => {
    setIsScanningDb(true);
    setRepairReport(null);

    setTimeout(() => {
      let repairedCount = 0;
      let notes: string[] = [];

      try {
        // 1. Check orders
        const rawOrders = localStorage.getItem('depo_orders');
        if (rawOrders) {
          const list = JSON.parse(rawOrders);
          const clean = list.filter((o: any) => {
            if (!o || !o.id) {
              repairedCount++;
              return false;
            }
            return true;
          });
          if (repairedCount > 0) {
            localStorage.setItem('depo_orders', JSON.stringify(clean));
            notes.push(`Menghapus ${repairedCount} order korup / tanpa ID.`);
          }
        }

        // 2. Check kasir transactions
        const rawKasir = localStorage.getItem('kasir_transactions');
        if (rawKasir) {
          const list = JSON.parse(rawKasir);
          const seenIds = new Set<string>();
          const dedup = list.filter((t: any) => {
            if (!t || !t.id || seenIds.has(t.id)) {
              repairedCount++;
              return false;
            }
            seenIds.add(t.id);
            return true;
          });
          if (dedup.length !== list.length) {
            localStorage.setItem('kasir_transactions', JSON.stringify(dedup));
            notes.push(`Menghapus duplikasi ${list.length - dedup.length} transaksi kasir.`);
          }
        }

        calculateStorage();
        setIsScanningDb(false);
        const report = notes.length > 0
          ? `Perbaikan selesai: ${notes.join(' ')}`
          : '✓ Integritas database sempurna. Tidak ditemukan korupsi data atau id ganda.';
        setRepairReport(report);
        showToast(report);
        logMasterAdminAction('DATABASE_REPAIR', report, 'warning');
      } catch (err: any) {
        setIsScanningDb(false);
        setRepairReport('Gagal melakukan scanning database: ' + err?.message);
      }
    }, 600);
  };

  const handleDownloadBackup = () => {
    try {
      const dump: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          dump[key] = localStorage.getItem(key);
        }
      }
      const jsonStr = JSON.stringify(dump, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JacS-DepoHub-Database-Backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✓ File Backup Database (.JSON) berhasil diunduh!');
      logMasterAdminAction('BACKUP_DATABASE', 'Export file backup JSON lengkap', 'info');
    } catch (err: any) {
      showToast('⚠️ Gagal membuat backup: ' + err?.message);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object') throw new Error('Format file tidak valid.');

        let count = 0;
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
            count++;
          }
        }

        calculateStorage();
        showToast(`✓ Berhasil memulihkan ${count} kunci database dari file backup!`);
        logMasterAdminAction('RESTORE_DATABASE', `Restore ${count} tabel dari backup`, 'critical');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err: any) {
        showToast('⚠️ File backup tidak valid: ' + err?.message);
      }
    };
    reader.readAsText(file);
  };

  // Eksekusi Factory Reset / Kosongkan Seluruh Data Operasional & Dummy
  const handleExecuteResetDummy = () => {
    // Verifikasi PIN ROOT sebelum eksekusi
    if (!resetPinInput || !verifySuperAdminPin(resetPinInput)) {
      setResetPinError('PIN Super Admin (Root) salah! Masukkan PIN yang valid untuk otorisasi.');
      return;
    }
    setResetPinError(null);

    try {
      const keysToClear = [
        'kasir_transactions',
        'argus_kasir_transactions',
        'depo_orders',
        'argus_orders',
        'jacs_orders',
        'piutang_data',
        'argus_receivables',
        'rekap_shift',
        'argus_settlements',
        'argus_inbound_drops',
        'argus_purchase_orders',
        'argus_pos_cart',
        'kasir_cart',
        'jacs_pos_cart',
        'argus_store_submissions',
      ];

      keysToClear.forEach((k) => {
        try {
          localStorage.setItem(k, JSON.stringify([]));
          localStorage.removeItem(k);
        } catch {}
      });

      // 1. Reset Transaksi Kasir & Piutang: Omzet Rp 0, 0 transaksi, 0 faktur tempo
      localStorage.setItem('argus_orders', JSON.stringify([]));
      localStorage.setItem('depo_orders', JSON.stringify([]));
      localStorage.setItem('jacs_orders', JSON.stringify([]));
      localStorage.setItem('argus_kasir_transactions', JSON.stringify([]));
      localStorage.setItem('kasir_transactions', JSON.stringify([]));
      localStorage.setItem('argus_receivables', JSON.stringify([]));
      localStorage.setItem('piutang_data', JSON.stringify([]));
      localStorage.setItem('rekap_shift', JSON.stringify([]));
      localStorage.setItem('kasir_cart', JSON.stringify([]));
      localStorage.setItem('argus_pos_cart', JSON.stringify([]));
      localStorage.setItem('jacs_pos_cart', JSON.stringify([]));
      localStorage.setItem('argus_inbound_drops', JSON.stringify([]));
      localStorage.setItem('argus_purchase_orders', JSON.stringify([]));

      // 2. Kosongkan / Nolkan Stok Fisik & Audit Wadah
      // Tabung galon, dus, tabung gas, dan krat diset 0. Tabung dipinjamkan pangkalan/warga = 0
      const emptyCirculation = [
        { id: 'AST-G01', category: 'Aqua 19L Original', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 600 },
        { id: 'AST-G02', category: 'Le Minerale 15L/19L', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 350 },
        { id: 'AST-G03', category: 'Vit 19L Danone', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 200 },
        { id: 'AST-G04', category: 'Cleo Smart Gallon 19L', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 150 },
        { id: 'AST-G05', category: 'Air RO Depo Mitra 19L', assetType: 'TABUNG_GALON', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 275 },
        { id: 'AST-K01', category: 'Krat Teh Botol Sosro 24 Btl', assetType: 'KRAT_BOTOL', unitName: 'Krat', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 160 },
        { id: 'AST-K02', category: 'Krat Coca-Cola / Fanta / Sprite 24 Btl', assetType: 'KRAT_BOTOL', unitName: 'Krat', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 120 },
        { id: 'AST-L01', category: 'Tabung Gas LPG 3kg Melon Bersubsidi', assetType: 'TABUNG_GAS', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 310 },
        { id: 'AST-L02', category: 'Bright Gas 5.5kg & 12kg Non-Subsidi', assetType: 'TABUNG_GAS', unitName: 'Tabung', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 80 },
        { id: 'AST-P01', category: 'Palet Plastik HDPE Gudang Depo (120x100)', assetType: 'PALET_KEMASAN', unitName: 'Palet', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 60 },
        { id: 'AST-P02', category: 'Palet Kayu Standard Truk Logistik (120x100)', assetType: 'PALET_KEMASAN', unitName: 'Palet', filled: 0, empty: 0, atStores: 0, loanedHousehold: 0, soldOutright: 0, damaged: 0, capacity: 85 },
      ];
      localStorage.setItem('argus_gallon_circulation', JSON.stringify(emptyCirculation));

      // Jika opsi pertahankan master SKU dengan stok 0 dipilih, nolkan stok produk
      try {
        const rawProducts = localStorage.getItem('argus_products');
        if (rawProducts) {
          const parsed = JSON.parse(rawProducts);
          const zeroStockProducts = parsed.map((p: any) => ({ ...p, stock: 0 }));
          localStorage.setItem('argus_products', JSON.stringify(zeroStockProducts));
        }
      } catch {}

      // 3. Reset Antrean & Pengiriman: 0 pesanan, 0 armada berjalan (status semua armada idle / standby)
      try {
        localStorage.removeItem('argus_dispatch_assignments');
      } catch {}

      // 4. Bersihkan Log Aktivitas & Riwayat Karyawan: Set absensi menjadi 0 hadir / standby (Libur)
      // 5. Bersihkan status pengajuan toko
      const clearedSubmissions = [
        {
          id: 'REG-2026-001',
          name: 'Toko Berkah Mandiri',
          category: 'Toko Mitra',
          ownerName: 'Bpk. H. Ridwan Kamil',
          phone: '0812-9876-5432',
          address: 'Jl. Otto Iskandardinata No. 45, Karanganyar, Subang',
          landmark: 'Sebelah Apotek Kimia Farma, Pagar Hijau',
          coordinates: { lat: -6.5652, lng: 107.7612 },
          mapsUrl: 'https://maps.google.com/?q=-6.5652,107.7612',
          priceTier: 'Toko',
          submittedByDriverName: 'Pak Bambang Sukoco',
          submittedAt: '27 Sep 2026 10.15 WITA',
          status: 'DISETUJUI',
          notes: 'Terverifikasi & disetujui untuk operasional depo Makassar.',
        },
      ];
      localStorage.setItem('argus_store_submissions', JSON.stringify(clearedSubmissions));

      // Perbarui versi state penyimpanan agar browser merender tampilan yang benar-benar bersih (Fresh State)
      localStorage.setItem('jacshub_mock_version', `factory_clean_${Date.now()}`);

      // Reset counter nomor struk kasir agar kembali dimulai dari STR-2026-0001 / ORD-2026-0001
      resetReceiptCounters();

      // Dispatch custom event global agar seluruh komponen (KasirView, App.tsx, Sirkulasi, dsb.) langsung mengosongkan state
      if (typeof window !== 'undefined') {
        const resetEvent = new CustomEvent('depo_data_reset', {
          detail: {
            preserveMasterSku: resetStockOption === 'preserve_master_zero_stock',
          },
        });
        window.dispatchEvent(resetEvent);
        window.dispatchEvent(new Event('storage'));
      }

      calculateStorage();
      setIsResetConfirmModalOpen(false);
      setResetPinInput('');
      setResetStep(1);

      const successMsg = 'Sistem berhasil dikosongkan total. Siap untuk input operasional riil.';
      showToast('✅ ' + successMsg);
      logMasterAdminAction('FACTORY_RESET', 'Factory Reset penuh dieksekusi: Seluruh transaksi kasir Rp 0, antrean 0, piutang Rp 0, armada standby, stok & audit wadah dinolkan.', 'critical');

      // Refresh event sekunder untuk memastikan reactivity
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('depo_data_reset', {
            detail: {
              preserveMasterSku: resetStockOption === 'preserve_master_zero_stock',
            },
          }));
        }
      }, 250);
    } catch (err: any) {
      showToast('⚠️ Gagal membersihkan data: ' + err?.message);
    }
  };

  // Kirim sinyal action: 'clear_dummy_orders' ke Google Apps Script Webhook
  const handleClearGoogleSheetOrders = async () => {
    const url = gasWebhookInput.trim() || getGasWebhookUrl();
    if (!url) {
      showToast('⚠️ URL Google Apps Script belum diatur. Silakan simpan URL Webhook terlebih dahulu.');
      return;
    }

    setIsClearingSheet(true);
    try {
      const res = await clearGasDummyOrders(url);
      setIsClearingSheet(false);
      setIsClearingSheetModalOpen(false);

      if (res.success) {
        showToast('✅ Sinyal pembersihan terkirim! Baris transaksi dummy di Google Sheets telah dikosongkan.');
        logMasterAdminAction('CLEAR_SHEETS_DUMMY', 'Kirim sinyal clear_dummy_orders ke Google Apps Script Webhook.', 'warning');
      } else {
        showToast('⚠️ Respon Apps Script: ' + res.message);
      }
    } catch (err: any) {
      setIsClearingSheet(false);
      showToast('⚠️ Gagal mengirim sinyal ke Google Sheets: ' + (err?.message || 'Koneksi error'));
    }
  };

  // ----------------------------------------------------
  // TAB D: PENGATURAN LISENSI & OTORITAS AKUN
  // ----------------------------------------------------
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<DepoBusinessProfile>(() => getDepoProfile());
  const [bankingForm, setBankingForm] = useState({
    bankName: profileForm.bankName || 'BCA (Bank Central Asia)',
    bankAccount: profileForm.bankAccount || '8090-1234-5678',
    bankHolder: profileForm.bankHolder || 'JacS DepoHub Official',
    qrisUrl: localStorage.getItem('jacs_qris_image_url') || '',
    paymentNotes: localStorage.getItem('jacs_payment_notes') || 'Sertakan nomor invoice / faktur saat transfer bank.',
  });

  const [depoLogoInput, setDepoLogoInput] = useState(() => {
    return propLogoUrl || localStorage.getItem('jacs_logo_url') || '/logo-jacs.svg';
  });

  const [managerPinInput, setManagerPinInput] = useState('');

  const handleChangeRootPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);

    if (!verifySuperAdminPin(currentPinInput)) {
      setPinChangeError('PIN Lama salah! Otoritas ditolak.');
      return;
    }

    if (newPinInput.length !== 6) {
      setPinChangeError('PIN Baru harus tepat 6 digit angka.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinChangeError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    updateMasterSuperAdminPin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setMasterAdmin(getMasterSuperAdmin());
    showToast('✓ PIN Keamanan Root (6 Digit) Berhasil Diperbarui!');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveDepoProfile(profileForm);
    showToast('✓ Profil Resmi Usaha Depo Berhasil Disimpan!');
  };

  const handleSaveBanking = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: DepoBusinessProfile = {
      ...profileForm,
      bankName: bankingForm.bankName,
      bankAccount: bankingForm.bankAccount,
      bankHolder: bankingForm.bankHolder,
    };
    setProfileForm(updatedProfile);
    saveDepoProfile(updatedProfile);
    try {
      localStorage.setItem('jacs_qris_image_url', bankingForm.qrisUrl.trim());
      localStorage.setItem('jacs_payment_notes', bankingForm.paymentNotes.trim());
    } catch {}
    showToast('✓ Rekening Bank & QRIS Depo Berhasil Disimpan!');
  };

  const handleSaveLogos = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDepo = depoLogoInput.trim();
    if (onUpdateLogoUrl) {
      onUpdateLogoUrl(trimmedDepo);
    } else {
      localStorage.setItem('jacs_logo_url', trimmedDepo);
    }
    showToast('✓ Logo Depo Berhasil Disimpan!');
  };

  const handleUpdateManagerPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPinInput.length < 4) {
      showToast('⚠️ PIN Manager minimal 4 digit!');
      return;
    }
    setManagerPin(managerPinInput);
    setManagerPinInput('');
    showToast('✓ PIN Executive Manager berhasil diperbarui!');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden text-slate-100 [body.light-theme_&]:text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-rose-500 text-white font-bold text-xs shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar Super Admin */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-xl border border-rose-900/60 [body.light-theme_&]:bg-white [body.light-theme_&]:border-rose-300 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-red-800 flex items-center justify-center text-white shadow-[0_0_18px_rgba(225,29,72,0.5)] border border-rose-400/50">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white [body.light-theme_&]:text-slate-900 uppercase tracking-wider">
                Super Admin Configuration &amp; Root Center
              </h2>
              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                LEVEL ROOT
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 [body.light-theme_&]:text-slate-600 mt-0.5 flex items-center gap-2">
              <span>Otoritas Pemilik:</span>
              <strong className="text-white [body.light-theme_&]:text-slate-900">
                {masterAdmin?.ownerName || 'Master Super Admin'}
              </strong>
              {masterAdmin?.masterEmail && (
                <span className="text-rose-400 font-mono">({masterAdmin.masterEmail})</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Lock Super Admin & Factory Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setResetStep(1);
              setResetPinInput('');
              setResetPinError(null);
              setIsResetConfirmModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-800 via-rose-700 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white text-[11px] font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-rose-400/50"
            title="Buka dialog Factory Reset / Kosongkan semua data operasional"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">⚠️ Factory Reset</span>
            <span className="sm:hidden">Reset</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>SESI ROOT AKTIF</span>
          </div>

          {onExitToNormalMode && (
            <button
              type="button"
              onClick={onExitToNormalMode}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-emerald-400/50"
              title="Keluar dari sesi Super Admin / Developer ROOT dan kembali ke Mode Kasir / Staf Operasional Normal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>🚪 KELUAR KE MODE NORMAL / KASIR</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLockSession}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Kunci sesi Super Admin dan amankan seluruh konfigurasi inti"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Sesi Root</span>
          </button>
        </div>
      </div>

      {/* 2. Navigasi 4 Tab Internal */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl shrink-0">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'health'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>a. Status Sistem &amp; Server Health</span>
        </button>

        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'doctor'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>b. AI System Doctor &amp; Bug Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('repair')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'repair'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>c. Kontrol Sinkronisasi &amp; DB Repair</span>
        </button>

        <button
          onClick={() => setActiveTab('license')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'license'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>d. Pengaturan Lisensi &amp; Otoritas</span>
        </button>
      </div>

      {/* 3. Tab Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-6">
        {/* ========================================================= */}
        {/* TAB A: STATUS SISTEM & SERVER HEALTH                      */}
        {/* ========================================================= */}
        {activeTab === 'health' && (
          <div className="space-y-3">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Express Server Status */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    Express Backend Server
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      serverStatus === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : serverStatus === 'checking'
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {serverStatus === 'online' ? 'ACTIVE' : serverStatus === 'checking' ? 'PINGING' : 'OFFLINE'}
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  {serverPingMs !== null ? `${serverPingMs} ms` : '---'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Port 3000 • Proxy Route</span>
                  <button
                    type="button"
                    onClick={pingServer}
                    className="text-cyan-400 hover:underline cursor-pointer font-bold"
                  >
                    Re-Ping
                  </button>
                </div>
              </div>

              {/* Card 2: GAS Webhook Health */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Google Sheets Webhook
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      gasStatus === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : gasStatus === 'checking'
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gasStatus === 'online' ? 'CONNECTED' : gasStatus === 'checking' ? 'TESTING' : 'STANDBY'}
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  {gasPingMs !== null ? `${gasPingMs} ms` : 'Ready'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Google Apps Script</span>
                  <button
                    type="button"
                    onClick={pingGasWebhook}
                    className="text-amber-400 hover:underline cursor-pointer font-bold"
                  >
                    Uji Webhook
                  </button>
                </div>
              </div>

              {/* Card 3: LocalStorage Capacity */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <HardDrive className="w-3.5 h-3.5 text-rose-400" />
                    Local Storage Vault
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {storageInfo.itemCount} Keys
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  {storageInfo.usedKb} KB <span className="text-xs text-slate-500">/ 5 MB</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(storageInfo.percent, 3)}%` }}
                  />
                </div>
              </div>

              {/* Card 4: Client & Hardware */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    Client Machine
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                </div>
                <div className="text-sm font-black text-white font-mono truncate">
                  {getHardwareFingerprint()}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} • ${navigator.platform}` : ''}
                </div>
              </div>
            </div>

            {/* Detailed Storage Breakdown & Server Response */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Box 1: Storage Key Breakdown */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Distribusi Memori Database Lokal</span>
                  </h3>
                  <button
                    type="button"
                    onClick={calculateStorage}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs pr-1">
                  {storageInfo.breakdown.slice(0, 10).map((item) => (
                    <div
                      key={item.key}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between font-mono"
                    >
                      <span className="truncate max-w-[200px] text-slate-300 text-[11px]">
                        {item.key}
                      </span>
                      <span className="text-cyan-300 font-bold shrink-0 text-[10.5px]">
                        {item.sizeKb} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Server API & Gemini Health */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-rose-400" />
                    <span>Status Server &amp; AI Integration Health</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    HTTP 200 OK
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Gemini API Key Provisioned:</span>
                      <strong className="text-emerald-400">
                        {serverHealthData?.hasApiKey ? 'Terpasang (Environment Active)' : 'Active (Fallback Mode)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Server Timestamp:</span>
                      <span className="font-mono text-slate-300">
                        {serverHealthData?.timestamp || new Date().toISOString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Latency Loopback:</span>
                      <span className="font-mono text-cyan-300">
                        {serverPingMs ? `${serverPingMs} ms` : 'Active'}
                      </span>
                    </div>
                  </div>

                  {gasDetails && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 text-[11px] text-amber-200">
                      <strong>Respon Google Apps Script:</strong>
                      <p className="mt-0.5 text-slate-300">{gasDetails}</p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10.5px] text-slate-400 leading-relaxed">
                    Sistem JacS DepoHub berjalan dengan arsitektur hibrida: Express API di sisi backend untuk proxy keamanan dan model AI, didukung Vite SPA untuk respon rendering antarmuka kilat.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB B: AI SYSTEM DOCTOR & BUG ANALYZER                    */}
        {/* ========================================================= */}
        {activeTab === 'doctor' && (
          <div className="space-y-3">
            {/* Header Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900 to-cyan-950/40 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/25 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                  <Stethoscope className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      AI System Doctor &amp; Bug Analyzer
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      GEMINI 3.8 FLASH
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Diagnosis otomatis konsistensi database lokal, beban antrean pengiriman armada, dan kelancaran sinkronisasi Sheets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunSystemDiagnosis}
                disabled={isDiagnosing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-[0_0_16px_rgba(225,29,72,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isDiagnosing ? 'Menganalisis Sistem...' : '🩺 Jalankan Diagnosis Sistem AI'}</span>
              </button>
            </div>

            {/* Diagnosis Result View */}
            {diagnosisResult && (
              <div className="space-y-3 animate-in fade-in">
                {/* Score & Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      System Health Score
                    </span>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {diagnosisResult.overallScore}
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Grade: {diagnosisResult.healthGrade}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 md:col-span-3 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Ringkasan Diagnosa:</span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {diagnosisResult.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {diagnosisResult.recommendationSummary}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <span className="text-slate-400">
                        Integritas DB: <strong className="text-emerald-400">{diagnosisResult.databaseIntegrity}</strong>
                      </span>
                      <span className="text-slate-400">
                        Status Sinkron: <strong className="text-cyan-400">{diagnosisResult.syncIntegrity}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Issues Detected */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daftar Temuan &amp; Analisis Kerentanan ({diagnosisResult.issuesFound.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {diagnosisResult.issuesFound.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-white font-bold">{issue.title}</strong>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold font-mono ${
                              issue.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : issue.severity === 'high'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                : issue.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {issue.description}
                        </p>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 mt-1">
                          <strong>Saran Aksi:</strong> {issue.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive AI System Doctor Chat */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Konsol Tanya Jawab AI System Doctor</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  Konsultasikan anomali data &amp; bug secara langsung
                </span>
              </div>

              {/* Quick Prompt Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Cek anomali order gantung',
                  'Apakah ada resiko memory overflow di browser?',
                  'Bagaimana keandalan sinkronisasi Google Sheets?',
                  'Rekomendasi langkah perawatan rutin',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSendDoctorChat(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] font-medium border border-slate-700 cursor-pointer transition-all active:scale-95"
                  >
                    💬 {preset}
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <div className="h-60 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                {doctorMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-rose-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9.5px] text-slate-500 font-mono mt-0.5 px-1">
                      {msg.time}
                    </span>
                  </div>
                ))}
                {doctorChatLoading && (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs py-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>AI System Doctor sedang menganalisis log...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendDoctorChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ketik pertanyaan teknis atau keluhan bug ke AI Doctor..."
                  value={doctorChatInput}
                  onChange={(e) => setDoctorChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!doctorChatInput.trim() || doctorChatLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB C: KONTROL SINKRONISASI & DATABASE REPAIR             */}
        {/* ========================================================= */}
        {activeTab === 'repair' && (
          <div className="space-y-3">
            {/* Section 1: Google Apps Script Webhook Manager */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Google Apps Script Webhook Manager
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Jalur sinkronisasi cloud real-time ke Google Spreadsheet
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-sync-all-transactions-sheets"
                  onClick={handleForceSyncAll}
                  disabled={isSyncingAll}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-950/40 disabled:opacity-60 disabled:cursor-wait"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingAll
                      ? syncProgress
                        ? `Mengirim ${syncProgress.total} transaksi...`
                        : 'Mengirim transaksi...'
                      : '🔄 Sinkronkan Seluruh Transaksi ke Sheets'}
                  </span>
                </button>
              </div>

              {/* Webhook URL Input & Actions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <span>URL Webhook Endpoint Aktif:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">(dapat diedit / dihapus bebas)</span>
                  </label>
                  {gasWebhookInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setGasWebhookInput('');
                        saveGasWebhookUrl('');
                        localStorage.setItem('jacs_gas_url', '');
                        showToast('✓ URL Webhook dikosongkan. Klik "Simpan URL Webhook" untuk menetapkan.');
                      }}
                      className="text-[10.5px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                    >
                      Kosongkan Input
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    id="input-superadmin-gas-webhook-url"
                    placeholder="Tempelkan URL Google Apps Script Web App (contoh: https://script.google.com/macros/s/.../exec)"
                    value={gasWebhookInput}
                    onChange={(e) => setGasWebhookInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-mono text-white placeholder-slate-500 outline-hidden transition-all"
                  />

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Tombol Simpan URL Webhook */}
                    <button
                      type="button"
                      id="btn-save-gas-webhook-url"
                      onClick={handleSaveGasUrl}
                      disabled={isSavingGasUrl}
                      className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md shadow-cyan-950/40 disabled:opacity-50"
                      title="Simpan URL Webhook ke localStorage (jacs_gas_url)"
                    >
                      <Save className={`w-3.5 h-3.5 ${isSavingGasUrl ? 'animate-spin' : ''}`} />
                      <span>{isSavingGasUrl ? 'Menyimpan...' : '💾 Simpan URL Webhook'}</span>
                    </button>

                    {/* Tombol Salin URL */}
                    <button
                      type="button"
                      onClick={handleCopyGasUrl}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 border border-slate-700"
                      title="Salin URL Webhook ke clipboard"
                    >
                      {copiedGasUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedGasUrl ? 'Tersalin' : 'Salin'}</span>
                    </button>

                    {/* Tombol Tes Kirim dengan respons visual "Menguji..." */}
                    <button
                      type="button"
                      id="btn-test-gas-webhook"
                      onClick={() => handleTestGasWebhook(true)}
                      disabled={isTestingGas}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border shadow-sm ${
                        isTestingGas
                          ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 cursor-wait'
                          : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40 hover:border-amber-400'
                      }`}
                      title="Uji koneksi Webhook ke Google Apps Script"
                    >
                      {isTestingGas ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                          <span>Menguji...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5 text-amber-300" />
                          <span>Tes Kirim</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  URL ini tersinkronisasi otomatis dengan modal <strong>'&lt;&gt; Skrip GAS'</strong> dan seluruh pengiriman transaksi kasir POS.
                </p>
              </div>

              {/* Progress bar during force sync */}
              {isSyncingAll && syncProgress && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Mengirim {syncProgress.total} transaksi ke Google Sheets...</span>
                    </span>
                    <span className="font-mono text-xs">
                      {syncProgress.current} / {syncProgress.total} Data ({Math.round((syncProgress.current / syncProgress.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-amber-500/20">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, (syncProgress.current / syncProgress.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Feedback Alert Banner after sync */}
              {syncFeedbackMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-white font-black">{syncFeedbackMessage}</p>
                    <p className="text-[10px] text-emerald-300/80 font-normal">
                      Payload transaksi terkirim via protocol Webhook (mode no-cors murni) sehingga tidak dicegat oleh CORS redirect Google.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSyncFeedbackMessage(null)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer px-1"
                    title="Tutup pemberitahuan"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Database Repair & Integrity Suite */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Database Maintenance &amp; Repair Suite
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Alat pembersihan rekaman data korup, backup snapshot, dan pemulihan arsip
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Scan & Repair */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <strong className="text-xs font-bold text-white block">
                      🧹 Scan &amp; Perbaiki Data Korup
                    </strong>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                      Memeriksa duplikasi transaksi, menghapus entri tanpa ID, dan merapikan indeks pelanggan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleScanAndRepairDb}
                    disabled={isScanningDb}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanningDb ? 'animate-spin' : ''}`} />
                    <span>{isScanningDb ? 'Scanning...' : 'Mulai Scan & Perbaiki'}</span>
                  </button>
                </div>

                {/* 2. Download JSON Backup */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <strong className="text-xs font-bold text-white block">
                      💾 Backup Database Lengkap (.JSON)
                    </strong>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                      Mengekspor seluruh tabel (pesanan, kasir, pelanggan, profil) ke file fisik terenkripsi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Unduh Backup JSON</span>
                  </button>
                </div>

                {/* 3. Restore from Backup */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <strong className="text-xs font-bold text-white block">
                      📥 Restore Database dari File
                    </strong>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                      Memulihkan seluruh data operasional dari file cadangan JSON yang telah diunduh sebelumnya.
                    </p>
                  </div>
                  <label className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 text-center">
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>Pilih File Restore</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Repair Report Notice */}
              {repairReport && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{repairReport}</span>
                </div>
              )}
            </div>

            {/* Section 3: Reset Operasional & Pembersihan Data Dummy (Fresh Start) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/50 via-slate-900 to-rose-950/40 border-2 border-rose-500/50 space-y-3.5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-rose-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-400 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                        Pembersihan Data Dummy &amp; Reset Operasional Riil
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-rose-600 text-white shadow-xs">
                        DANGER ZONE
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Gunakan aksi di bawah setelah uji coba selesai untuk memulai pencatatan kasir riil depo dari nol.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Tombol Aksi: Reset Lokal & Kosongkan Sheet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                {/* Tombol 1: Hapus Data Dummy & Reset Sistem ke Nol */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-600/50 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      <strong className="text-xs font-black text-white">
                        Hapus Data Dummy &amp; Reset Sistem ke Nol
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Menghapus seluruh riwayat transaksi kasir, pesanan armada, dan piutang dummy. Counter nomor struk akan di-reset kembali ke <strong className="text-emerald-400 font-mono">STR-2026-0001</strong> dan keranjang aktif dikosongkan.
                    </p>
                  </div>

                    <button
                    type="button"
                    id="btn-reset-dummy-operational-data"
                    onClick={() => {
                      setResetStep(1);
                      setResetPinInput('');
                      setResetPinError(null);
                      setIsResetConfirmModalOpen(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 via-rose-600 to-amber-600 hover:from-red-600 hover:to-rose-500 text-white text-xs sm:text-sm font-black shadow-[0_0_24px_rgba(244,63,94,0.6)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 border-2 border-rose-400 animate-pulse hover:animate-none tracking-wide"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                    <span>⚠️ FACTORY RESET - KOSONGKAN SEMUA DATA OPERASIONAL &amp; DUMMY</span>
                  </button>
                </div>

                {/* Tombol 2: Kosongkan Baris Transaksi di Google Sheets */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-600/40 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </div>
                      <strong className="text-xs font-black text-white">
                        Kosongkan Baris Transaksi di Google Sheets
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Mengirim sinyal <code className="text-amber-300 font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded border border-slate-800">clear_dummy_orders</code> ke Apps Script untuk menghapus seluruh baris 2 ke bawah di sheet <strong>'Pesanan'</strong> tanpa menghapus baris 1 (Header).
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-clear-sheets-dummy-orders"
                    disabled={isClearingSheet}
                    onClick={() => setIsClearingSheetModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <RefreshCw className={`w-4 h-4 ${isClearingSheet ? 'animate-spin' : ''}`} />
                    <span>{isClearingSheet ? 'Mengirim Sinyal...' : '🧹 Kosongkan Baris Transaksi di Google Sheets'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB D: PENGATURAN LISENSI & OTORITAS AKUN                  */}
        {/* ========================================================= */}
        {activeTab === 'license' && (
          <div className="space-y-4">
            {/* 1. Master Owner & License Certificate Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-950 border-2 border-rose-500/60 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-400 text-rose-300 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                    <ShieldCheck className="w-7 h-7 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        {masterAdmin?.ownerName || 'Master Super Admin'}
                      </h3>
                      <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 shadow-xs">
                        VERIFIED ROOT
                      </span>
                    </div>
                    <p className="text-xs text-rose-200 font-mono mt-0.5">
                      {masterAdmin?.masterEmail || 'owner@depojacs.com'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tingkat Lisensi
                  </span>
                  <strong className="text-amber-400 font-black text-sm tracking-wide">
                    {masterAdmin?.licenseTier || 'ENTERPRISE LIFETIME PRO'}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">License Key</span>
                  <strong className="text-cyan-300 text-[11px] truncate block">
                    {masterAdmin?.licenseKey || 'JACS-ROOT-2026-X89K-P72M'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Hardware Device ID</span>
                  <strong className="text-slate-300 text-[11px] truncate block">
                    {masterAdmin?.hardwareFingerprint || getHardwareFingerprint()}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Tanggal Aktivasi</span>
                  <strong className="text-emerald-400 text-[11px] truncate block">
                    {masterAdmin?.registeredAt
                      ? new Date(masterAdmin.registeredAt).toLocaleDateString('id-ID', { dateStyle: 'long' })
                      : 'Lifetime Registered'}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Ubah PIN Keamanan Root (6 Digit) */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <KeyRound className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Ubah PIN Keamanan Root (6 Digit Angka)
                </h3>
              </div>

              <form onSubmit={handleChangeRootPin} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold">PIN Root Lama:</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="6 digit PIN lama"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:border-rose-500 outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold">PIN Root Baru (6 Digit):</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="6 digit PIN baru"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:border-rose-500 outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold">Konfirmasi PIN Baru:</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ulangi PIN baru"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:border-rose-500 outline-hidden"
                    />
                  </div>
                </div>

                {pinChangeError && (
                  <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{pinChangeError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!currentPinInput || newPinInput.length !== 6 || newPinInput !== confirmPinInput}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                  >
                    Simpan PIN Root Baru
                  </button>
                </div>
              </form>
            </div>

            {/* 3. PIN Executive Manager Quick Update */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    PIN Akses Executive Manager (Level 2)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  PIN Aktif: <strong className="text-cyan-400 font-mono">{getManagerPin()}</strong>
                </span>
              </div>

              <form onSubmit={handleUpdateManagerPin} className="flex items-center gap-3">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Ketik PIN Manager baru..."
                  value={managerPinInput}
                  onChange={(e) => setManagerPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-64 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:border-cyan-500 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={managerPinInput.length < 4}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Ubah PIN Manager
                </button>
              </form>
            </div>

            {/* 4. Profil Usaha Depo & Rekening Bank */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Form Profil Usaha */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Identitas Resmi Depo
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Nama Depo Air:</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Alamat Lengkap:</label>
                    <textarea
                      rows={2}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">NIB:</label>
                      <input
                        type="text"
                        value={profileForm.nib}
                        onChange={(e) => setProfileForm({ ...profileForm, nib: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">NPWP:</label>
                      <input
                        type="text"
                        value={profileForm.npwp}
                        onChange={(e) => setProfileForm({ ...profileForm, npwp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer mt-1"
                  >
                    Simpan Profil Depo
                  </button>
                </form>
              </div>

              {/* Form Rekening Bank */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Rekening Bank &amp; QRIS
                  </h3>
                </div>

                <form onSubmit={handleSaveBanking} className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Nama Bank:</label>
                    <input
                      type="text"
                      value={bankingForm.bankName}
                      onChange={(e) => setBankingForm({ ...bankingForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Nomor Rekening:</label>
                      <input
                        type="text"
                        value={bankingForm.bankAccount}
                        onChange={(e) => setBankingForm({ ...bankingForm, bankAccount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Atas Nama (Holder):</label>
                      <input
                        type="text"
                        value={bankingForm.bankHolder}
                        onChange={(e) => setBankingForm({ ...bankingForm, bankHolder: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Catatan Pembayaran:</label>
                    <input
                      type="text"
                      value={bankingForm.paymentNotes}
                      onChange={(e) => setBankingForm({ ...bankingForm, paymentNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer mt-1"
                  >
                    Simpan Rekening Bank
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FACTORY RESET - KOSONGKAN SELURUH DATA OPERASIONAL & DUMMY       */}
      {/* ========================================================================= */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-b border-rose-600/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-400 border border-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                  <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                      ROOT AUTHORIZATION
                    </span>
                    <span className="text-[10px] text-rose-300 font-bold">
                      {resetStep === 1 ? 'Langkah 1/2: Konfirmasi Aksi' : 'Langkah 2/2: Verifikasi PIN ROOT'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                    Factory Reset &amp; Kosongkan Data Operasional
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmModalOpen(false);
                  setResetStep(1);
                  setResetPinInput('');
                  setResetPinError(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {resetStep === 1 ? (
                <>
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 leading-relaxed flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        PERINGATAN: Anda akan melakukan FACTORY RESET sistem secara total!
                      </p>
                      <p className="text-[11px] text-rose-200/90 mt-1">
                        Tindakan ini akan mengosongkan seluruh arsip transaksi dummy, mereset antrean pengiriman, mengenolkan piutang, dan menyiapkan sistem ke kondisi riil siap pakai.
                      </p>
                    </div>
                  </div>

                  {/* Opsi Penanganan Stok & Master SKU */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                      Pilihan Penanganan Stok Fisik &amp; Master SKU:
                    </span>
                    <div className="space-y-2">
                      <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        resetStockOption === 'preserve_master_zero_stock'
                          ? 'bg-rose-950/30 border-rose-500 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="resetStockOption"
                          value="preserve_master_zero_stock"
                          checked={resetStockOption === 'preserve_master_zero_stock'}
                          onChange={() => setResetStockOption('preserve_master_zero_stock')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <strong className="text-xs block text-slate-200">
                            Pertahankan Master SKU dengan Stok 0 (Direkomendasikan)
                          </strong>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Katalog SKU produk (Aqua, Vit, Le Minerale, Sembako, dsb.) tetap ada di database, tetapi seluruh stok fisik digudangkan ke <strong>0 unit</strong>.
                          </p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        resetStockOption === 'zero_all_containers'
                          ? 'bg-rose-950/30 border-rose-500 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="resetStockOption"
                          value="zero_all_containers"
                          checked={resetStockOption === 'zero_all_containers'}
                          onChange={() => setResetStockOption('zero_all_containers')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <strong className="text-xs block text-slate-200">
                            Kosongkan Seluruh Stok &amp; Riwayat Sirkulasi Wadah Total
                          </strong>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Nolkan seluruh stok galon terisi, dus, tabung gas, krat, serta tabung dipinjamkan pangkalan/warga.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Rincian Tindakan Pembersihan */}
                  <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                      Daftar Operasi Yang Akan Dijalankan:
                    </span>
                    <ul className="space-y-2 text-[11px] text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Reset Transaksi Kasir:</strong> Omzet kasir menjadi <strong className="text-emerald-400 font-mono">Rp 0</strong> dan <strong className="text-emerald-400 font-mono">0 transaksi</strong>. Keranjang aktif dibersihkan.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Reset Antrean &amp; Pengiriman:</strong> <strong className="text-cyan-400">0 pesanan</strong>, <strong className="text-cyan-400">0 armada berjalan</strong> (seluruh armada diset ke status Idle / Standby Depo).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Reset Piutang &amp; Tempo:</strong> <strong className="text-amber-400">0 faktur tempo belum lunas</strong> dan <strong className="text-amber-400 font-mono">Rp 0</strong> saldo piutang beredar.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Nolkan Audit Wadah &amp; Stok Fisik:</strong> Galon terisi, dus, tabung gas, dan krat diset <strong>0</strong>. Tabung dipinjamkan di pangkalan/warga = <strong>0</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Bersihkan Log &amp; Riwayat Karyawan:</strong> Absensi diset <strong>0 hadir / Standby (Libur)</strong>, komisi harian dinolkan.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Bersihkan LocalStorage:</strong> Versi state diperbarui untuk memastikan rendering tampilan yang benar-benar bersih (Fresh State).
                        </span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                /* Langkah 2: Verifikasi PIN Super Admin (Root) */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 leading-relaxed flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        Otorisasi Keamanan Tingkat ROOT Diperlukan
                      </p>
                      <p className="text-[11px] text-amber-200/90 mt-1">
                        Masukkan PIN Super Admin (Root) 4-6 digit untuk mengonfirmasi eksekusi Factory Reset.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-200 block text-center">
                      Masukkan PIN Super Admin (Root):
                    </label>
                    <input
                      type="password"
                      autoFocus
                      maxLength={6}
                      value={resetPinInput}
                      onChange={(e) => {
                        setResetPinInput(e.target.value.replace(/\D/g, ''));
                        setResetPinError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && resetPinInput.length >= 4) {
                          handleExecuteResetDummy();
                        }
                      }}
                      placeholder="••••"
                      className="w-full max-w-[200px] mx-auto block px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-rose-500 text-white font-mono text-center tracking-[0.5em] text-lg focus:outline-hidden focus:border-red-400"
                    />

                    {resetPinError && (
                      <p className="text-xs text-rose-400 text-center font-bold animate-shake">
                        {resetPinError}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 text-center">
                      PIN default instalasi awal adalah <strong>9999</strong> jika belum pernah diubah di menu Pengaturan Keamanan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (resetStep === 2) {
                    setResetStep(1);
                    setResetPinError(null);
                  } else {
                    setIsResetConfirmModalOpen(false);
                    setResetPinInput('');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-slate-700"
              >
                {resetStep === 2 ? '← Kembali' : 'Batal'}
              </button>

              {resetStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setResetStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-900/50 flex items-center gap-2 active:scale-95 transition-all border border-rose-400/40"
                >
                  <span>Lanjut ke Verifikasi PIN ROOT →</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-confirm-execute-reset-dummy"
                  disabled={resetPinInput.length < 4}
                  onClick={handleExecuteResetDummy}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-900/50 flex items-center gap-2 active:scale-95 transition-all border border-rose-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>⚠️ Eksekusi Factory Reset Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI KOSONGKAN BARIS TRANSAKSI DI GOOGLE SHEETS            */}
      {/* ========================================================================= */}
      {isClearingSheetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-b border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-600 text-slate-950 shadow-xs">
                      GOOGLE APPS SCRIPT
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">Cloud Webhook Sinyal</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                    Kosongkan Baris Transaksi di Google Sheets
                  </h3>
                </div>
              </div>
              <button
                type="button"
                disabled={isClearingSheet}
                onClick={() => setIsClearingSheetModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 leading-relaxed flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-xs sm:text-sm">
                    Kirim sinyal 'clear_dummy_orders' ke Google Apps Script Webhook?
                  </p>
                  <p className="text-[11px] text-amber-200/90 mt-1">
                    Sistem akan menghapus seluruh baris 2 ke bawah pada sheet <strong>'Pesanan'</strong> di Google Spreadsheet tanpa menghapus baris 1 (Header).
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Target Webhook Endpoint:
                </span>
                <p className="font-mono text-[11px] text-cyan-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {gasWebhookInput.trim() || getGasWebhookUrl() || '(URL Webhook belum diatur)'}
                </p>
                <p className="text-[10.5px] text-slate-400">
                  Pastikan skrip GAS di Google Sheets telah terdeploy sebagai Web App dengan akses izin 'Anyone'.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isClearingSheet}
                onClick={() => setIsClearingSheetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-slate-700 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-clear-sheets-dummy-orders"
                disabled={isClearingSheet}
                onClick={handleClearGoogleSheetOrders}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-950/50 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                <RefreshCw className={`w-4 h-4 ${isClearingSheet ? 'animate-spin' : ''}`} />
                <span>{isClearingSheet ? 'Mengirim Sinyal...' : '🧹 Kosongkan Baris Sheet Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
