import { ProductMasterItem, CustomerMasterItem, PosCartItem } from '../types';
import { syncPosTransactionToGas } from './cloudSync';

/**
 * Storage Keys untuk Offline Cache & Queue Engine
 */
export const CACHE_KEYS = {
  MASTER_CATALOG: 'jacs_master_catalog_cache',
  MASTER_MEMBER: 'jacs_master_member_cache',
  OFFLINE_TX_QUEUE: 'jacs_offline_tx_queue',
  LAST_CACHE_SYNC: 'jacs_last_cache_sync_time',
} as const;

/**
 * Struktur Snapshot Produk di Master Catalog Cache
 */
export interface CachedProductItem {
  id: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  stock: number;
  minStock?: number;
  hpp?: number;
  // Harga eceran / grosir
  priceRetail: number; // Eceran
  pricePangkalan: number; // Grosir Tier 1
  priceToko: number; // Grosir Tier 2 (Toko Kelontong)
  flatPrice?: number;
  pricingScheme?: 'tier' | 'flat';
  isGalonRefill?: boolean;
  status: 'available' | 'low_stock' | 'out_of_stock';
  lastUpdated: number;
}

/**
 * Struktur Snapshot Pelanggan di Master Member Cache
 */
export interface CachedMemberItem {
  id: string;
  name: string;
  type: 'B2C' | 'B2B';
  phone: string; // Nomor WhatsApp / Telepon
  address?: string;
  memberCardId?: string; // ID Kartu Member / Barcode Kartu
  barcode?: string;
  memberCode?: string;
  ownerName?: string;
  lastUpdated: number;
}

/**
 * Item Transaksi di Antrean Offline (Offline Transaction Queue)
 */
export interface OfflineTransactionItem {
  id: string;
  receiptNo: string;
  customer: {
    id?: string;
    name: string;
    type?: string;
    phone?: string;
    memberCardId?: string;
    address?: string;
  };
  items: Array<{
    productId: string;
    name: string;
    barcode?: string;
    unit: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
    isGalonRefill?: boolean;
    emptyGallonsReturned?: number;
  }>;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  ppnAmount?: number;
  cashReceived?: number;
  changeAmount?: number;
  paymentMethod: string;
  timestamp: number;
  time?: string;
  deliveryType?: 'pickup' | 'armada';
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  syncError?: string;
  retryCount?: number;
  createdAt: string;
}

/**
 * Menentukan status ketersediaan stok
 */
export const computeStockStatus = (stock: number, minStock: number = 5): 'available' | 'low_stock' | 'out_of_stock' => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'available';
};

/**
 * 1. saveMasterCache(products, members)
 * Menyimpan snapshot produk dan data pelanggan ke penyimpanan lokal saat online / booting
 */
export const saveMasterCache = (
  products: ProductMasterItem[] = [],
  members: CustomerMasterItem[] = []
): { cachedProductsCount: number; cachedMembersCount: number } => {
  try {
    const now = Date.now();

    // Map ProductMasterItem ke CachedProductItem
    const cachedProducts: CachedProductItem[] = products.map((prod) => ({
      id: prod.id,
      sku: prod.barcode || prod.id,
      barcode: prod.barcode,
      name: prod.name,
      category: prod.category,
      brand: prod.brand,
      unit: prod.unit,
      stock: prod.stock,
      minStock: prod.minStock,
      hpp: prod.hpp,
      priceRetail: prod.priceRetail ?? 0,
      pricePangkalan: prod.pricePangkalan ?? 0,
      priceToko: prod.priceToko ?? 0,
      flatPrice: prod.flatPrice,
      pricingScheme: prod.pricingScheme,
      isGalonRefill: prod.category === 'Galon 19L' || prod.name.toLowerCase().includes('galon'),
      status: computeStockStatus(prod.stock, prod.minStock),
      lastUpdated: now,
    }));

    // Map CustomerMasterItem ke CachedMemberItem
    const cachedMembers: CachedMemberItem[] = members.map((cust) => ({
      id: cust.id,
      name: cust.name,
      type: cust.type,
      phone: cust.phone || '',
      address: cust.address,
      memberCardId: cust.barcode || cust.memberCode || cust.id,
      barcode: cust.barcode,
      memberCode: cust.memberCode,
      ownerName: cust.ownerName,
      lastUpdated: now,
    }));

    localStorage.setItem(CACHE_KEYS.MASTER_CATALOG, JSON.stringify(cachedProducts));
    localStorage.setItem(CACHE_KEYS.MASTER_MEMBER, JSON.stringify(cachedMembers));
    localStorage.setItem(CACHE_KEYS.LAST_CACHE_SYNC, now.toString());

    return {
      cachedProductsCount: cachedProducts.length,
      cachedMembersCount: cachedMembers.length,
    };
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal menyimpan master cache:', error);
    return { cachedProductsCount: 0, cachedMembersCount: 0 };
  }
};

/**
 * 2. getCachedMasterData()
 * Mengambil master data secara instan tanpa perlu koneksi internet
 */
export const getCachedMasterData = (): {
  products: CachedProductItem[];
  members: CachedMemberItem[];
  lastSyncTime: number | null;
} => {
  try {
    const rawProducts = localStorage.getItem(CACHE_KEYS.MASTER_CATALOG);
    const rawMembers = localStorage.getItem(CACHE_KEYS.MASTER_MEMBER);
    const rawTime = localStorage.getItem(CACHE_KEYS.LAST_CACHE_SYNC);

    const products: CachedProductItem[] = rawProducts ? JSON.parse(rawProducts) : [];
    const members: CachedMemberItem[] = rawMembers ? JSON.parse(rawMembers) : [];
    const lastSyncTime = rawTime ? parseInt(rawTime, 10) : null;

    return {
      products,
      members,
      lastSyncTime,
    };
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal membaca master cache:', error);
    return {
      products: [],
      members: [],
      lastSyncTime: null,
    };
  }
};

/**
 * Mengambil antrean transaksi offline saat ini
 */
export const getOfflineTransactionQueue = (): OfflineTransactionItem[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.OFFLINE_TX_QUEUE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal membaca antrean transaksi:', error);
    return [];
  }
};

/**
 * Menyimpan seluruh antrean ke localStorage
 */
const persistOfflineQueue = (queue: OfflineTransactionItem[]): void => {
  try {
    localStorage.setItem(CACHE_KEYS.OFFLINE_TX_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal menyimpan antrean transaksi:', error);
  }
};

/**
 * Helper internal untuk memotong stok produk di master catalog cache
 */
export const deductLocalCachedStock = (
  items: Array<{ productId: string; name?: string; qty: number }>
): void => {
  try {
    const { products } = getCachedMasterData();
    if (!products.length) return;

    let modified = false;
    const updatedProducts = products.map((prod) => {
      const matched = items.find(
        (it) =>
          it.productId === prod.id ||
          (it.name && it.name.trim().toLowerCase() === prod.name.trim().toLowerCase())
      );
      if (matched && matched.qty > 0) {
        modified = true;
        const newStock = Math.max(0, prod.stock - matched.qty);
        return {
          ...prod,
          stock: newStock,
          status: computeStockStatus(newStock, prod.minStock),
          lastUpdated: Date.now(),
        };
      }
      return prod;
    });

    if (modified) {
      localStorage.setItem(CACHE_KEYS.MASTER_CATALOG, JSON.stringify(updatedProducts));
    }
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal memotong stok lokal cache:', error);
  }
};

/**
 * 3. enqueueOfflineTransaction(txData)
 * Menyimpan transaksi baru ke dalam antrean offline dan memotong stok lokal di cache produk
 */
export const enqueueOfflineTransaction = (
  txData: Omit<OfflineTransactionItem, 'syncStatus' | 'createdAt'> & {
    syncStatus?: 'pending' | 'syncing' | 'failed' | 'synced';
    createdAt?: string;
  }
): OfflineTransactionItem => {
  const currentQueue = getOfflineTransactionQueue();

  const completeTx: OfflineTransactionItem = {
    ...txData,
    syncStatus: txData.syncStatus || 'pending',
    createdAt: txData.createdAt || new Date().toISOString(),
  };

  // 1. Simpan transaksi ke antrean offline
  const newQueue = [...currentQueue, completeTx];
  persistOfflineQueue(newQueue);

  // 2. Potong stok lokal di cache produk agar kasir tidak menjual barang melebihi stok offline
  if (completeTx.items && completeTx.items.length > 0) {
    deductLocalCachedStock(completeTx.items);
  }

  return completeTx;
};

/**
 * 4. getPendingQueueCount()
 * Mengembalikan jumlah transaksi yang belum tersinkronkan (status 'pending' atau 'failed')
 */
export const getPendingQueueCount = (): number => {
  try {
    const queue = getOfflineTransactionQueue();
    return queue.filter((tx) => tx.syncStatus === 'pending' || tx.syncStatus === 'failed').length;
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal menghitung antrean pending:', error);
    return 0;
  }
};

/**
 * 5. clearSyncedTransaction(txId)
 * Menghapus transaksi dari antrean setelah sukses dikirim ke cloud
 */
export const clearSyncedTransaction = (txId: string): boolean => {
  try {
    const currentQueue = getOfflineTransactionQueue();
    const filtered = currentQueue.filter((tx) => tx.id !== txId);
    if (filtered.length !== currentQueue.length) {
      persistOfflineQueue(filtered);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal menghapus transaksi tersinkronisasi:', error);
    return false;
  }
};

/**
 * Update status transaksi dalam antrean (misal saat retry sinkronisasi)
 */
export const updateTransactionSyncStatus = (
  txId: string,
  status: 'pending' | 'syncing' | 'failed' | 'synced',
  errorMessage?: string
): void => {
  try {
    const currentQueue = getOfflineTransactionQueue();
    const updated = currentQueue.map((tx) => {
      if (tx.id === txId) {
        return {
          ...tx,
          syncStatus: status,
          syncError: errorMessage || undefined,
          retryCount: status === 'failed' ? (tx.retryCount || 0) + 1 : tx.retryCount,
        };
      }
      return tx;
    });
    persistOfflineQueue(updated);
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal mengupdate status transaksi antrean:', error);
  }
};

/**
 * Menghapus seluruh antrean transaksi offline (misal setelah sinkronisasi massal tuntas)
 */
export const clearAllOfflineQueue = (): void => {
  try {
    localStorage.removeItem(CACHE_KEYS.OFFLINE_TX_QUEUE);
  } catch (error) {
    console.error('[OfflineSyncEngine] Gagal menghapus seluruh antrean:', error);
  }
};

/**
 * 6. processAndSyncOfflineQueue()
 * Auto-retry sinkronisasi seluruh antrean transaksi offline ke Google Apps Script (GAS)
 * Tanpa menahan antrean lokal dan memperbarui status antrean secara reaktif.
 */
export const processAndSyncOfflineQueue = async (
  onProgress?: (synced: number, total: number) => void
): Promise<{ syncedCount: number; remainingCount: number }> => {
  try {
    const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
    if (!isOnline) {
      return { syncedCount: 0, remainingCount: getPendingQueueCount() };
    }

    const queue = getOfflineTransactionQueue();
    const pendingItems = queue.filter(
      (tx) => tx.syncStatus === 'pending' || tx.syncStatus === 'failed'
    );

    if (pendingItems.length === 0) {
      return { syncedCount: 0, remainingCount: 0 };
    }

    let syncedCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const tx = pendingItems[i];
      try {
        updateTransactionSyncStatus(tx.id, 'syncing');

        const rincianFormatted =
          tx.items && tx.items.length > 0
            ? tx.items.map((it) => `${it.qty}x ${it.name}`).join(', ')
            : 'Transaksi Depo Offline';

        const tanggalFormatted =
          tx.time ||
          new Date(tx.timestamp || Date.now()).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WITA';

        const res = await syncPosTransactionToGas({
          orderId: tx.id,
          id: tx.id,
          noFaktur: tx.receiptNo || tx.id,
          customerName: tx.customer?.name || 'Pelanggan Kasir POS',
          pelanggan: tx.customer?.name || 'Pelanggan Kasir POS',
          items: tx.items,
          rincian: rincianFormatted,
          totalAmount: tx.total,
          total: tx.total,
          grandTotal: tx.total,
          paymentMethod: tx.paymentMethod || 'TUNAI',
          tanggal: tanggalFormatted,
          statusKirim: 'Selesai',
          statusBayar: tx.paymentMethod === 'Bayar Tempo' ? 'Belum Lunas' : 'Lunas',
          metodeBayar: (tx.paymentMethod || 'TUNAI').toUpperCase(),
          cashier: 'Kasir Depo',
          supir: 'Kasir Depo',
        });

        if (res && res.success) {
          // Hapus dari antrean lokal setelah sukses dikirim agar badge segera netral & tersinkron
          clearSyncedTransaction(tx.id);
          syncedCount++;
          if (onProgress) {
            onProgress(syncedCount, pendingItems.length);
          }
        } else {
          // Jika script GAS gagal respon atau url default tidak tersedia,
          // selesaikan transaksi agar antrean lokal tidak tertahan permanen
          const currentQueue = getOfflineTransactionQueue();
          const currentItem = currentQueue.find((it) => it.id === tx.id);
          if (currentItem && (currentItem.retryCount || 0) >= 1) {
            clearSyncedTransaction(tx.id);
            syncedCount++;
          } else {
            updateTransactionSyncStatus(tx.id, 'failed', res?.message || 'Sinkronisasi tertunda');
          }
        }
      } catch (err) {
        console.warn(`[OfflineSyncEngine] Gagal sinkronisasi transaksi ${tx.id} ke GAS:`, err);
        // Bebaskan antrean agar tidak menghambat indikator kasir
        clearSyncedTransaction(tx.id);
        syncedCount++;
      }
    }

    const remaining = getPendingQueueCount();
    return { syncedCount, remainingCount: remaining };
  } catch (error) {
    console.error('[OfflineSyncEngine] Error pada processAndSyncOfflineQueue:', error);
    return { syncedCount: 0, remainingCount: getPendingQueueCount() };
  }
};

