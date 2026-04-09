import type { BomRow } from '@/types';

export type StockStatus = 'available' | 'low' | 'out';

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  qtyAvailable: number;
}

export interface ComponentStock {
  partCode: string;
  qtyRequired: number;
  qtyAvailable: number;
  stockStatus: StockStatus;
  warehouses: WarehouseStock[];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Integration request timeout')), timeoutMs);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function toNum(value: unknown): number {
  return Number.parseFloat(String(value ?? '0')) || 0;
}

function computeQtyRequired(row: BomRow): number {
  const qty = toNum(row.qty);
  const scrap = toNum(row.scrapPercent);
  if (qty <= 0) return 0;
  return qty * (1 + scrap / 100);
}

function toStatus(qtyAvailable: number, qtyRequired: number): StockStatus {
  if (qtyAvailable <= 0) return 'out';
  if (qtyAvailable < qtyRequired) return 'low';
  return 'available';
}

function buildFallback(rows: BomRow[]): ComponentStock[] {
  return rows
    .filter((row) => row.levelNum === 2 && row.partCode)
    .map((row, index) => {
      const qtyRequired = computeQtyRequired(row);
      const factor = index % 3 === 0 ? 1.3 : index % 3 === 1 ? 0.6 : 0;
      const qtyAvailable = Number((qtyRequired * factor).toFixed(2));
      return {
        partCode: row.partCode,
        qtyRequired,
        qtyAvailable,
        stockStatus: toStatus(qtyAvailable, qtyRequired),
        warehouses: [
          {
            warehouseId: 'WH-MAIN',
            warehouseName: 'Main Warehouse',
            qtyAvailable,
          },
        ],
      };
    });
}

export async function getComponentStocks(rows: BomRow[]): Promise<{ items: ComponentStock[]; source: 'integration' | 'fallback' }> {
  const baseUrl = process.env.INVENTORY_API_BASE_URL;
  const timeoutMs = Number(process.env.INTEGRATION_TIMEOUT_MS || 4000);
  const partRows = rows.filter((row) => row.levelNum === 2 && row.partCode);
  if (partRows.length === 0) return { items: [], source: 'fallback' };

  if (!baseUrl) return { items: buildFallback(rows), source: 'fallback' };

  const partCodes = Array.from(new Set(partRows.map((row) => row.partCode)));
  const requestPayload = {
    materials: partCodes,
    includeWarehouses: true,
  };

  try {
    const response = await withTimeout(
      fetch(new URL('/inventory/stock/by-materials', baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(process.env.INVENTORY_API_KEY ? { Authorization: `Bearer ${process.env.INVENTORY_API_KEY}` } : {}),
        },
        body: JSON.stringify(requestPayload),
        cache: 'no-store',
      }),
      timeoutMs,
    );

    if (!response.ok) throw new Error(`Inventory API failed with ${response.status}`);
    const payload = await response.json();
    const stocksRaw = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    const byCode = new Map<string, any>();
    stocksRaw.forEach((item: any) => {
      const code = String(item.partCode ?? item.materialCode ?? '');
      if (code) byCode.set(code, item);
    });

    const items: ComponentStock[] = partRows.map((row) => {
      const qtyRequired = computeQtyRequired(row);
      const stock = byCode.get(row.partCode);
      const qtyAvailable = toNum(stock?.qtyAvailable ?? stock?.available ?? 0);
      const warehousesRaw = Array.isArray(stock?.warehouses) ? stock.warehouses : [];
      const warehouses: WarehouseStock[] = warehousesRaw.map((warehouse: any, index: number) => ({
        warehouseId: String(warehouse.id ?? warehouse.warehouseId ?? `WH-${index + 1}`),
        warehouseName: String(warehouse.name ?? warehouse.warehouseName ?? `Warehouse ${index + 1}`),
        qtyAvailable: toNum(warehouse.qtyAvailable ?? warehouse.available ?? 0),
      }));
      return {
        partCode: row.partCode,
        qtyRequired,
        qtyAvailable,
        stockStatus: toStatus(qtyAvailable, qtyRequired),
        warehouses,
      };
    });

    return { items, source: 'integration' };
  } catch {
    return { items: buildFallback(rows), source: 'fallback' };
  }
}

