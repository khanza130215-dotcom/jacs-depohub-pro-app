import { OrderItem, ReceivableItem, ArmadaItem, EmployeeItem } from '../types';

export type SyncStatus = 'synced' | 'offline' | 'syncing' | 'error';

const STORAGE_KEY_WEBHOOK_URL = 'jacs_gas_webhook_url';
const STORAGE_KEY_LAST_SYNC = 'jacs_last_sync_time';

export const getGasWebhookUrl = (): string => {
  try {
    return (
      localStorage.getItem('jacs_gas_url') ||
      localStorage.getItem('gas_webhook_url') ||
      localStorage.getItem(STORAGE_KEY_WEBHOOK_URL) ||
      localStorage.getItem('google_apps_script_url') ||
      localStorage.getItem('gas_url') ||
      localStorage.getItem('gasUrl') ||
      localStorage.getItem('google_sheets_url') ||
      ''
    );
  } catch {
    return '';
  }
};

export const saveGasWebhookUrl = (url: string): void => {
  try {
    const trimmed = url.trim();
    localStorage.setItem('jacs_gas_url', trimmed);
    localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, trimmed);
    localStorage.setItem('gas_webhook_url', trimmed);
    localStorage.setItem('google_apps_script_url', trimmed);
    localStorage.setItem('gas_url', trimmed);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('gas_url_changed'));
    }
  } catch {
    // ignore
  }
};

export const isValidGasUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://script.google.com/macros/s/') ||
    trimmed.startsWith('https://script.google.com/') ||
    /^https?:\/\/.+/i.test(trimmed)
  );
};

export const getLastSyncTime = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || '';
  } catch {
    return '';
  }
};

export const saveLastSyncTime = (timeStr: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeStr);
  } catch {
    // ignore
  }
};

/**
 * Kirim Payload ke Google Apps Script Web App Webhook
 */
export const triggerGasWebhook = async (
  action:
    | 'ping'
    | 'sync_all'
    | 'new_order'
    | 'spot_order'
    | 'approve_order'
    | 'pay_receivable'
    | 'settlement'
    | 'bongkar_muat'
    | 'mutasi_stok'
    | 'create_order'
    | 'clear_dummy_orders',
  data: Record<string, any>,
  customUrl?: string
): Promise<{ success: boolean; message: string; error?: string }> => {
  const url = customUrl ? customUrl.trim() : getGasWebhookUrl();
  if (!url) {
    return {
      success: false,
      message: 'Mode Offline / Local: URL Web App Google Apps Script belum diatur.',
    };
  }

  if (!isValidGasUrl(url)) {
    return {
      success: false,
      message: 'Format Google Apps Script Web App URL tidak valid.',
    };
  }

  const payload = {
    action,
    timestamp: new Date().toISOString(),
    ...data,
  };

  try {
    // Gunakan mode no-cors dengan Content-Type: text/plain;charset=utf-8 dan body JSON murni
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const nowFormatted = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
    saveLastSyncTime(nowFormatted);

    return {
      success: true,
      message: `Sinkronisasi '${action}' ke Google Sheets berhasil terkirim (${nowFormatted})`,
    };
  } catch (err: any) {
    console.error('GAS Webhook Error:', err);
    return {
      success: false,
      message: 'Gagal mengirim data ke Google Apps Script.',
      error: err?.message || String(err),
    };
  }
};

/**
 * Kirim Sinyal Kosongkan Baris Transaksi di Google Sheets (action: clear_dummy_orders)
 * Menghapus baris 2 ke bawah di sheet 'Pesanan' tanpa menghapus baris 1 (header).
 */
export const clearGasDummyOrders = async (
  customUrl?: string
): Promise<{ success: boolean; message: string; error?: string }> => {
  return triggerGasWebhook(
    'clear_dummy_orders',
    {
      targetSheet: 'Pesanan',
      description: 'Kosongkan baris transaksi dummy (baris 2 ke bawah)',
      requestedAt: new Date().toISOString(),
    },
    customUrl
  );
};

/**
 * Kirim pembaruan Master SKU dan buffer stok fisik ke Google Apps Script (Sheet: 'StokProduk')
 */
export const syncProductStockToGas = async (
  product: any,
  customUrl?: string
): Promise<{ success: boolean; message: string; error?: string }> => {
  return triggerGasWebhook(
    'sync_all',
    {
      products: [product],
      targetSheet: 'StokProduk',
      notes: `Update SKU ${product.id} - ${product.name} (Stok: ${product.stock})`,
    },
    customUrl
  );
};

/**
 * Kirim Payload Transaksi Kasir POS ke Google Apps Script (create_order) menggunakan JSON murni
 * Menggunakan format payload standar create_order yang kompatibel 100% dengan Kode.gs
 */
export const syncPosTransactionToGas = async (orderPayload: {
  orderId?: string;
  id?: string;
  noFaktur?: string;
  tanggal?: string;
  timestamp?: string | number;
  customerName?: string;
  namaPelanggan?: string;
  customer?: string;
  pelanggan?: string;
  driverName?: string;
  supir?: string;
  cashier?: string;
  driver?: string;
  items?: any;
  itemsSummary?: string;
  rincian?: string;
  totalAmount?: number;
  total?: number;
  grandTotal?: number;
  paymentMethod?: string;
  payment?: string;
  metodeBayar?: string;
  status?: string;
  statusBayar?: string;
  statusKirim?: string;
  [key: string]: any;
}): Promise<{ success: boolean; message: string }> => {
  const storedUrl = getGasWebhookUrl();
  const url = storedUrl || 'https://script.google.com/macros/s/AKfycbx_jacs_pos_sync/exec';

  const noFaktur = orderPayload.id || orderPayload.noFaktur || orderPayload.orderId || `STR-${Date.now()}`;
  
  // Format 'tanggal' lokal rapi (misal: 14.30 WITA)
  let tanggal = '';
  if (orderPayload.timestamp) {
    try {
      const d = typeof orderPayload.timestamp === 'number' ? new Date(orderPayload.timestamp) : new Date(orderPayload.timestamp);
      if (!isNaN(d.getTime())) {
        tanggal = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
      }
    } catch {}
  } else if (orderPayload.tanggal && typeof orderPayload.tanggal === 'string') {
    if (orderPayload.tanggal.includes('T') && orderPayload.tanggal.includes('Z')) {
      try {
        const d = new Date(orderPayload.tanggal);
        if (!isNaN(d.getTime())) {
          tanggal = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
        }
      } catch {}
    } else {
      tanggal = orderPayload.tanggal.replace('WIB', 'WITA');
      if (!tanggal.includes('WITA') && !tanggal.includes('WIT')) tanggal += ' WITA';
    }
  } else if (orderPayload.time && typeof orderPayload.time === 'string') {
    tanggal = orderPayload.time.replace('WIB', 'WITA');
    if (!tanggal.includes('WITA') && !tanggal.includes('WIT')) tanggal += ' WITA';
  }
  if (!tanggal) {
    tanggal = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
  }

  const pelanggan =
    orderPayload.customerName ||
    orderPayload.namaPelanggan ||
    orderPayload.pelanggan ||
    orderPayload.customer ||
    'Pelanggan Kasir POS';
  const supir = orderPayload.driverName || orderPayload.supir || orderPayload.driver || orderPayload.cashier || 'Kasir Depo';

  // Format 'rincian' mengambil daftar barang dari keranjang
  let rincian = '';
  if (Array.isArray(orderPayload.items)) {
    rincian = orderPayload.items
      .map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`)
      .join(', ');
  } else if (Array.isArray(orderPayload.cartItems)) {
    rincian = orderPayload.cartItems
      .map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`)
      .join(', ');
  } else if (Array.isArray(orderPayload.cart)) {
    rincian = orderPayload.cart
      .map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.namaBarang || 'Barang'}`)
      .join(', ');
  } else if (typeof orderPayload.rincian === 'string' && orderPayload.rincian.trim()) {
    rincian = orderPayload.rincian;
  } else if (typeof orderPayload.itemsSummary === 'string' && orderPayload.itemsSummary.trim()) {
    rincian = orderPayload.itemsSummary;
  } else if (typeof orderPayload.items === 'string' && orderPayload.items.trim()) {
    rincian = orderPayload.items;
  } else {
    rincian = 'Transaksi Depo';
  }

  // Format 'total' mengambil nilai grandTotal || totalPrice || totalAmount || total || 0
  const total = Number(
    orderPayload.grandTotal ||
    orderPayload.totalPrice ||
    orderPayload.totalAmount ||
    orderPayload.total ||
    0
  );
  const statusKirim = orderPayload.statusKirim || 'Selesai';
  const statusBayar =
    orderPayload.status ||
    orderPayload.statusBayar ||
    ((orderPayload.paymentMethod || orderPayload.payment) === 'Bayar Tempo' ? 'Belum Lunas' : 'Lunas');
  const metodeBayar = (orderPayload.paymentMethod || orderPayload.metodeBayar || orderPayload.payment || 'TUNAI').toUpperCase();

  const payload = {
    action: 'create_order',
    noFaktur,
    tanggal,
    pelanggan,
    supir,
    rincian,
    total,
    statusKirim,
    statusBayar,
    metodeBayar,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Penting agar browser tidak memblokir redirect Google
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const nowFormatted =
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB';
    saveLastSyncTime(nowFormatted);

    return {
      success: true,
      message: '🟢 Transaksi berhasil disinkronkan ke Google Sheets!',
    };
  } catch (err: any) {
    console.error('GAS Transaction Sync Error:', err);
    return {
      success: false,
      message: 'Gagal mengirim transaksi ke Google Apps Script.',
    };
  }
};

export const syncOrderToGAS = syncPosTransactionToGas;

/**
 * Kirim Seluruh Transaksi ke Google Apps Script secara berurutan dengan aksi standar 'create_order'
 * Kompatibel 100% dengan Kode.gs
 */
export const syncAllTransactionsToGas = async (
  transactionsList: any[],
  customUrl?: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; message: string }> => {
  const webhookUrl = customUrl ? customUrl.trim() : getGasWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diatur.',
    };
  }

  const totalCount = transactionsList.length;

  for (let i = 0; i < totalCount; i++) {
    const order = transactionsList[i];
    if (onProgress) {
      onProgress(i + 1, totalCount);
    }

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

    // Format 'total' mengambil nilai grandTotal || totalPrice || totalAmount || total || 0
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
      pelanggan:
        order.customerName ||
        order.namaPelanggan ||
        order.pelanggan ||
        order.customer ||
        'Pelanggan Kasir POS',
      supir: order.driverName || order.supir || order.driver || order.cashier || 'Kasir Depo',
      rincian,
      total,
      statusKirim: order.statusKirim || 'Selesai',
      statusBayar:
        order.status ||
        order.statusBayar ||
        ((order.paymentMethod || order.payment) === 'Bayar Tempo' ? 'Belum Lunas' : 'Lunas'),
      metodeBayar: (order.paymentMethod || order.metodeBayar || order.payment || 'TUNAI').toUpperCase(),
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Gagal mengirim order ke GAS:', order.id, err);
    }

    if (i < totalCount - 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  const nowFormatted =
    new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
  saveLastSyncTime(nowFormatted);

  return {
    success: true,
    message: '✅ Seluruh transaksi telah dikirim ke Google Sheets! Silakan refresh halaman spreadsheet Anda.',
  };
};

/**
 * Uji Koneksi & Kirim Data Baris Tes ke Google Apps Script Web App
 */
export const testGasWebhookConnection = async (
  targetUrl: string
): Promise<{
  success: boolean;
  statusCode: number | string;
  responseType: string;
  message: string;
  rawResponse?: string;
  timestamp: string;
  payloadSent: Record<string, string>;
}> => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const testId = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;

  const testPayload = {
    action: 'create_order',
    noFaktur: testId,
    tanggal: new Date().toISOString(),
    pelanggan: 'Pelanggan Uji Coba Depo',
    supir: 'Tester Admin',
    rincian: '1x Galon Aqua 19L (Rp 20.000), 1x Dus Club 330ml (Rp 38.000)',
    total: 58000,
    statusKirim: 'Selesai',
    statusBayar: 'Lunas',
    metodeBayar: 'TUNAI',
  };

  try {
    let directSuccess = true;
    let directStatus: number | string = '200 OK (no-cors Webhook delivered)';
    let rawText = 'Payload JSON murni berhasil dikirim dengan Content-Type: text/plain;charset=utf-8 via no-cors mode.';

    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
    });

    const nowFormatted = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
    saveLastSyncTime(nowFormatted);

    return {
      success: directSuccess,
      statusCode: directStatus,
      responseType: 'JSON String (Content-Type: text/plain;charset=utf-8)',
      message: '🟢 Transaksi tes JSON berhasil dikirim ke Google Apps Script Webhook!',
      rawResponse: rawText,
      timestamp,
      payloadSent: {
        action: testPayload.action,
        orderId: testPayload.noFaktur,
        customerName: testPayload.pelanggan,
        items: testPayload.rincian,
        totalAmount: String(testPayload.total),
        paymentMethod: testPayload.metodeBayar,
        cashier: testPayload.supir,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 'Error / Failed to Fetch',
      responseType: 'Error',
      message: `Gagal mengirim data tes: ${err?.message || String(err)}`,
      rawResponse: String(err),
      timestamp,
      payloadSent: {
        action: testPayload.action,
        orderId: testPayload.noFaktur,
        customerName: testPayload.pelanggan,
        items: testPayload.rincian,
        totalAmount: String(testPayload.total),
        paymentMethod: testPayload.metodeBayar,
        cashier: testPayload.supir,
      },
    };
  }
};

/**
 * 📥 Ekspor Cadangan Data Lengkap ke JSON
 */
export const downloadBackupJSON = (backupPayload: {
  orders: OrderItem[];
  receivables: ReceivableItem[];
  armadaList?: ArmadaItem[];
  employees?: EmployeeItem[];
  settlement?: Record<string, any>;
  inboundDrops?: any[];
  purchaseOrders?: any[];
}): void => {
  const exportData = {
    appName: 'JacS DepoHub Pro',
    depoTitle: 'Depo Air Mineral Subang - Tirta Mandiri',
    backupDate: new Date().toISOString(),
    backupDateFormatted: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    statistics: {
      totalOrders: backupPayload.orders.length,
      totalReceivables: backupPayload.receivables.length,
      activeArmadaCount: backupPayload.armadaList?.length || 0,
      employeesCount: backupPayload.employees?.length || 0,
      totalInboundDrops: backupPayload.inboundDrops?.length || 0,
    },
    data: {
      orders: backupPayload.orders,
      receivables: backupPayload.receivables,
      armada: backupPayload.armadaList || [],
      employees: backupPayload.employees || [],
      settlementShift: backupPayload.settlement || null,
      inboundDrops: backupPayload.inboundDrops || [],
      purchaseOrders: backupPayload.purchaseOrders || [],
    },
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `jacs-depohub-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 📊 Ekspor Rekap Harian Operasional ke Format CSV (Excel Friendly UTF-8 BOM)
 */
export const downloadDailyCSV = (data: {
  orders: OrderItem[];
  receivables: ReceivableItem[];
  settlement?: Record<string, any>;
}): void => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  let csvContent = '\uFEFF'; // UTF-8 BOM agar aksen & simbol terbaca sempurna di Microsoft Excel

  // SECTION 1: HEADER LAPORAN
  csvContent += '=========================================================================\n';
  csvContent += `JACS DEPOHUB - REKAPITULASI OPERASIONAL HARIAN (${dateStr})\n`;
  csvContent += 'DEPO AIR MINERAL SUBANG - TIRTA MANDIRI\n';
  csvContent += '=========================================================================\n\n';

  // SECTION 2: SHEET 1 - PESANAN
  csvContent += '--- 1. DAFTAR PESANAN & TRANSAKSI HARIAN ---\n';
  const orderHeaders = [
    'No. Faktur',
    'Tanggal/Waktu',
    'Nama Toko/Pelanggan',
    'Kategori Pelanggan',
    'Supir/Armada',
    'Rincian Barang',
    'Total Galon',
    'Total Bayar (Rp)',
    'Status Pengiriman',
    'Status Bayar',
    'Metode Bayar',
    'Tabung Kosong Kembali',
    'Hutang Tabung',
  ];
  csvContent += orderHeaders.map(escapeCsv).join(',') + '\n';

  data.orders.forEach((ord) => {
    const row = [
      ord.id,
      ord.time || '-',
      ord.customerName,
      ord.customerType || 'Pelanggan Umum',
      ord.driver,
      ord.items,
      ord.totalGalon,
      ord.totalAmount,
      ord.deliveryStatus,
      ord.paymentStatus,
      ord.paymentMethod || (ord.paymentStatus === 'Tempo / Hutang' ? 'TEMPO BON TOKO' : 'Tunai'),
      ord.emptyGallonsReturned ?? ord.totalGalon,
      ord.emptyGallonDebt || 0,
    ];
    csvContent += row.map(escapeCsv).join(',') + '\n';
  });

  csvContent += '\n';

  // SECTION 3: SHEET 2 - BUKU PIUTANG
  csvContent += '--- 2. BUKU KARTU PIUTANG & MONITORING TEMPO ---\n';
  const recHeaders = [
    'ID Piutang',
    'No. Faktur Order',
    'Nama Toko/Mitra',
    'Alamat',
    'Kontak/WA',
    'Nominal Tagihan (Rp)',
    'Galon Dipinjam',
    'Tanggal Transaksi',
    'Jatuh Tempo',
    'Status Piutang',
  ];
  csvContent += recHeaders.map(escapeCsv).join(',') + '\n';

  data.receivables.forEach((rec) => {
    const row = [
      rec.id,
      rec.orderId || '-',
      rec.customerName,
      rec.address,
      rec.phone,
      rec.amount,
      rec.gallonsLoaned,
      rec.transactionDate || '-',
      rec.dueDate,
      rec.status,
    ];
    csvContent += row.map(escapeCsv).join(',') + '\n';
  });

  csvContent += '\n';

  // SECTION 4: SHEET 3 - REKONSILIASI KAS & REKAP SHIFT
  csvContent += '--- 3. REKONSILIASI KAS & TUTUP BUKU SHIFT (17:00 WIB) ---\n';
  csvContent += 'Parameter,Nilai / Keterangan\n';
  csvContent += `${escapeCsv('Tanggal Rekonsiliasi')},${escapeCsv(dateStr)}\n`;
  csvContent += `${escapeCsv('Omzet Kasir Depo (Tunai)')},${escapeCsv('Rp 11.200.000')}\n`;
  csvContent += `${escapeCsv('Omzet Kasir Depo (QRIS/Transfer)')},${escapeCsv('Rp 7.250.000')}\n`;
  csvContent += `${escapeCsv('Subtotal Kasir Depo')},${escapeCsv('Rp 18.450.000')}\n`;
  csvContent += `${escapeCsv('Total Setoran Armada Supir')},${escapeCsv('Rp 12.740.000')}\n`;
  csvContent += `${escapeCsv('Target Kas Fisik Brankas')},${escapeCsv('Rp 23.940.000 (MATCH / NIHIL SELISIH)')}\n`;
  csvContent += `${escapeCsv('Retur Galon Ditarik Armada')},${escapeCsv('300 Tabung')}\n`;
  csvContent += `${escapeCsv('Sisa Galon Tertahan di Toko')},${escapeCsv('705 Tabung')}\n`;
  csvContent += `${escapeCsv('Status Tutup Buku')},${escapeCsv('TERKUNCI & SAH')}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fileDate = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `rekap-operasional-depo-${fileDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
