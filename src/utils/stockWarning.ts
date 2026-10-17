import { ProductMasterItem } from '../types';

export interface StockWarningDetail {
  product: ProductMasterItem;
  mode: 'percentage' | 'quantity';
  maxCapacity: number;
  thresholdValue: number;
  thresholdQty: number; // Ambang batas kuantitas fisik
  amberThresholdQty: number; // Ambang batas kuning
  currentStock: number;
  remainingPct: number; // Persentase stok aktual dari kapasitas gudang (%)
  status: 'critical' | 'warning' | 'safe';
  badgeLabel: string;
  isCritical: boolean;
  isWarning: boolean;
  isSafe: boolean;
  restockRecommendedQty: number; // Jumlah yang disarankan untuk mengembalikan buffer stok ke 100%
  estimatedCostRp: number; // Estimasi biaya pengadaan (HPP x recommendedQty)
}

/**
 * Menghitung ambang batas e-warning stok produk secara konsisten dan terintegrasi
 * Logika Ambang Batas:
 * - Persentase sisa stok: (Stok Saat Ini / Kapasitas Maksimal) * 100%
 * - Jika sisa stok <= 10% atau 0: STATUS CRITICAL / HABIS (Merah Berkedip)
 * - Jika sisa stok <= 30%: STATUS WARNING / Low Stock (Kuning/Oranye Menyala)
 * - Di atas 30%: STATUS SAFE (Hijau Aman)
 */
export function calculateStockWarning(product: ProductMasterItem): StockWarningDetail {
  const currentStock = Math.max(0, Number(product.stock) || 0);

  // Default mode & kapasitas gudang jika belum diisi
  const mode: 'percentage' | 'quantity' = product.warningMode || 'percentage';

  // Kapasitas normal/maksimal gudang (default dinamis berdasarkan stok & reorder point jika tidak di-set)
  const defaultCapacity = Math.max(
    currentStock,
    (product.reorderPoint || product.minStock || 50) * 2.5,
    product.unit.toLowerCase().includes('dus') ? 500 : 1000
  );
  const maxCapacity = Math.max(
    1,
    Number(product.maxCapacity) > 0 ? Number(product.maxCapacity) : Math.round(defaultCapacity)
  );

  // Nilai input ambang batas manajemen (default 30% jika mode %, atau minStock jika mode qty)
  const defaultThresholdVal = mode === 'percentage' ? 30 : (Number(product.minStock) || 100);
  const thresholdValue =
    typeof product.warningThresholdValue === 'number' && product.warningThresholdValue >= 0
      ? product.warningThresholdValue
      : defaultThresholdVal;

  let thresholdQty: number;
  let amberThresholdQty: number;

  if (mode === 'percentage') {
    thresholdQty = Math.round((maxCapacity * thresholdValue) / 100);
    amberThresholdQty = Math.round((maxCapacity * Math.min(30, thresholdValue + 5)) / 100);
  } else {
    thresholdQty = Math.round(thresholdValue);
    const bufferTolerance = Math.max(5, Math.round(maxCapacity * 0.05));
    amberThresholdQty = thresholdQty + bufferTolerance;
  }

  // Hitung persentase sisa stok terhadap kapasitas maksimal
  const remainingPct = Math.min(999, Math.round((currentStock / maxCapacity) * 100));

  // Penentuan Status:
  // <= 10% atau 0 = CRITICAL (Merah Berkedip)
  // <= 30% = WARNING (Kuning/Oranye Menyala)
  // > 30% = SAFE
  let status: 'critical' | 'warning' | 'safe' = 'safe';
  if (currentStock <= 0 || remainingPct <= 10) {
    status = 'critical';
  } else if (remainingPct <= 30 || currentStock <= thresholdQty) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  // Format label badge
  let badgeLabel = `✓ Stok Aman (${remainingPct}%)`;
  if (currentStock === 0) {
    badgeLabel = `🚨 STOK HABIS (0%)! Segera PO Pabrik`;
  } else if (status === 'critical') {
    badgeLabel = `🚨 STOK KRITIS (${remainingPct}%)! Sisa: ${currentStock} ${product.unit}`;
  } else if (status === 'warning') {
    badgeLabel = `⚠️ STOK MENIPIS (<30%)! Sisa: ${currentStock} ${product.unit}`;
  }

  const restockRecommendedQty = Math.max(0, maxCapacity - currentStock);
  const estimatedCostRp = restockRecommendedQty * (Number(product.hpp) || 0);

  return {
    product,
    mode,
    maxCapacity,
    thresholdValue,
    thresholdQty,
    amberThresholdQty,
    currentStock,
    remainingPct,
    status,
    badgeLabel,
    isCritical: status === 'critical',
    isWarning: status === 'warning',
    isSafe: status === 'safe',
    restockRecommendedQty,
    estimatedCostRp,
  };
}

/**
 * Menghasilkan teks dinamis untuk Running Teks Marquee Alert Telemetri Depo
 * Format: "🚨 PERINGATAN LOGISTIK: Stok [Nama Produk] sisa [X Unit] (<= 30%)! Segera buat PO Restock ke Supplier [Nama Supplier]."
 */
export function generateMarqueeWarningText(products: ProductMasterItem[]): {
  hasCriticalAlerts: boolean;
  marqueeText: string;
  criticalCount: number;
  warningCount: number;
  totalLowStockCount: number;
  criticalItems: StockWarningDetail[];
  warningItems: StockWarningDetail[];
  allLowStockItems: StockWarningDetail[];
} {
  const details = products.map(calculateStockWarning);
  const criticalItems = details.filter((d) => d.status === 'critical');
  const warningItems = details.filter((d) => d.status === 'warning');
  const allLowStockItems = [...criticalItems, ...warningItems].sort((a, b) => a.remainingPct - b.remainingPct);

  if (allLowStockItems.length === 0) {
    return {
      hasCriticalAlerts: false,
      marqueeText:
        '✓ TELEMETRI GUDANG OPTIMAL: Seluruh SKU berada aman di atas ambang toleransi e-warning manajemen depo • Kapasitas dan buffer stok terjaga sempurna.',
      criticalCount: 0,
      warningCount: 0,
      totalLowStockCount: 0,
      criticalItems: [],
      warningItems: [],
      allLowStockItems: [],
    };
  }

  // Format teks peringatan realtime terintegrasi:
  // "🚨 PERINGATAN LOGISTIK: Stok [Nama Produk] sisa [X Unit] (<= 30%)! Segera buat PO Restock ke Supplier [Nama Supplier]."
  const itemsText = allLowStockItems
    .map((item) => {
      const supName = item.product.supplier || 'Principal Pabrik Terdaftar';
      const pctTag = item.currentStock === 0 ? 'HABIS 0%' : item.status === 'critical' ? `KRITIS ${item.remainingPct}%` : `MENIPIS ${item.remainingPct}%`;
      return `🚨 PERINGATAN LOGISTIK: Stok ${item.product.name} sisa ${item.currentStock} ${item.product.unit} (${pctTag} <= 30%)! Segera buat PO Restock ke Supplier ${supName}`;
    })
    .join('  ✦  ');

  return {
    hasCriticalAlerts: criticalItems.length > 0 || allLowStockItems.length > 0,
    marqueeText: itemsText,
    criticalCount: criticalItems.length,
    warningCount: warningItems.length,
    totalLowStockCount: allLowStockItems.length,
    criticalItems,
    warningItems,
    allLowStockItems,
  };
}
