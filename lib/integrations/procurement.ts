import type { HardwareRow, PackingRow } from '@/types';

export interface ProcurementSnapshot {
  source: 'integration' | 'fallback';
  hardwareCost: number;
  packingCost: number;
  readyForPurchase: boolean;
  details?: Record<string, unknown>;
}

function toNum(value: unknown): number {
  return Number.parseFloat(String(value ?? 0)) || 0;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Integration request timeout')), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function computeFallback(input: { hardwareRows: HardwareRow[]; packingRows: PackingRow[] }): ProcurementSnapshot {
  const hardwareCost = input.hardwareRows.reduce((sum, row) => sum + toNum(row.qty) * toNum(row.unitCost), 0);
  const packingCost = input.packingRows.reduce((sum, row) => sum + toNum(row.qty) * toNum(row.unitCost), 0);
  const readyForPurchase = input.hardwareRows.length > 0 || input.packingRows.length > 0;
  return {
    source: 'fallback',
    hardwareCost,
    packingCost,
    readyForPurchase,
  };
}

export async function getProcurementSnapshot(input: {
  bomId: string;
  bomCode: string;
  hardwareRows: HardwareRow[];
  packingRows: PackingRow[];
}): Promise<ProcurementSnapshot> {
  const baseUrl = process.env.PROCUREMENT_API_BASE_URL;
  if (!baseUrl) return computeFallback(input);

  const timeoutMs = Number(process.env.INTEGRATION_TIMEOUT_MS || 4000);
  try {
    const response = await withTimeout(
      fetch(new URL('/procurement/bom-snapshot', baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(process.env.PROCUREMENT_API_KEY ? { Authorization: `Bearer ${process.env.PROCUREMENT_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          bomId: input.bomId,
          bomCode: input.bomCode,
          hardwareRows: input.hardwareRows,
          packingRows: input.packingRows,
        }),
        cache: 'no-store',
      }),
      timeoutMs,
    );
    if (!response.ok) throw new Error(`Procurement API failed with ${response.status}`);
    const payload = await response.json();
    return {
      source: 'integration',
      hardwareCost: toNum(payload?.hardwareCost),
      packingCost: toNum(payload?.packingCost),
      readyForPurchase: Boolean(payload?.readyForPurchase),
      details: payload?.details && typeof payload.details === 'object' ? payload.details : undefined,
    };
  } catch {
    return computeFallback(input);
  }
}
