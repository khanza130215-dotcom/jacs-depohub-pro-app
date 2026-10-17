/**
 * Receipt & Order Counter Utility
 * Mengatur nomor urut struk kasir POS (STR-2026-0001) dan ID pesanan (ORD-2026-0001)
 * secara sekuensial dan persisten di localStorage.
 */

export const getNextReceiptNumber = (): string => {
  try {
    const year = new Date().getFullYear();
    const key = `jacs_receipt_counter_${year}`;
    let current = parseInt(localStorage.getItem(key) || '0', 10);
    current += 1;
    localStorage.setItem(key, current.toString());
    return `STR-${year}-${String(current).padStart(4, '0')}`;
  } catch {
    return `STR-${new Date().getFullYear()}-0001`;
  }
};

export const getNextOrderNumber = (): string => {
  try {
    const year = new Date().getFullYear();
    const key = `jacs_order_counter_${year}`;
    let current = parseInt(localStorage.getItem(key) || '0', 10);
    current += 1;
    localStorage.setItem(key, current.toString());
    return `ORD-${year}-${String(current).padStart(4, '0')}`;
  } catch {
    return `ORD-${new Date().getFullYear()}-0001`;
  }
};

export const getNextPiutangNumber = (): string => {
  try {
    const year = new Date().getFullYear();
    const key = `jacs_piutang_counter_${year}`;
    let current = parseInt(localStorage.getItem(key) || '0', 10);
    current += 1;
    localStorage.setItem(key, current.toString());
    return `PIU-${year}-${String(current).padStart(4, '0')}`;
  } catch {
    return `PIU-${new Date().getFullYear()}-0001`;
  }
};

export const resetReceiptCounters = (): void => {
  try {
    const year = new Date().getFullYear();
    localStorage.setItem(`jacs_receipt_counter_${year}`, '0');
    localStorage.setItem(`jacs_order_counter_${year}`, '0');
    localStorage.setItem(`jacs_piutang_counter_${year}`, '0');
    localStorage.setItem('jacs_receipt_counter', '0');
    localStorage.setItem('jacs_order_counter', '0');
    localStorage.setItem('jacs_piutang_counter', '0');
  } catch {
    // ignore
  }
};
