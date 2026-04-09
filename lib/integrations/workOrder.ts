export interface WorkOrderItem {
  id: string;
  code: string;
  status: string;
  qty?: number;
  plannedStart?: string;
}

export interface WorkOrderUsageResult {
  count: number;
  items: WorkOrderItem[];
  source: 'integration' | 'fallback';
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

function parseFallback(): WorkOrderItem[] {
  const raw = process.env.WORK_ORDER_FALLBACK_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => ({
      id: String(item.id ?? `wo-${index + 1}`),
      code: String(item.code ?? item.woCode ?? `WO-${index + 1}`),
      status: String(item.status ?? 'OPEN'),
      qty: Number(item.qty ?? 0) || 0,
      plannedStart: item.plannedStart ? String(item.plannedStart) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function getWorkOrderUsage(params: { bomId?: string; bomCode?: string }): Promise<WorkOrderUsageResult> {
  const baseUrl = process.env.WORK_ORDER_API_BASE_URL;
  const timeoutMs = Number(process.env.INTEGRATION_TIMEOUT_MS || 4000);

  if (!baseUrl) {
    const fallback = parseFallback();
    return { count: fallback.length, items: fallback, source: 'fallback' };
  }

  const url = new URL('/work-orders/by-bom', baseUrl);
  if (params.bomId) url.searchParams.set('bomId', params.bomId);
  if (params.bomCode) url.searchParams.set('bomCode', params.bomCode);

  try {
    const response = await withTimeout(
      fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          ...(process.env.WORK_ORDER_API_KEY ? { Authorization: `Bearer ${process.env.WORK_ORDER_API_KEY}` } : {}),
        },
        cache: 'no-store',
      }),
      timeoutMs,
    );

    if (!response.ok) throw new Error(`Work Order API failed with ${response.status}`);
    const payload = await response.json();
    const itemsRaw = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    const items: WorkOrderItem[] = itemsRaw.map((item: any, index: number) => ({
      id: String(item.id ?? item.workOrderId ?? `wo-${index + 1}`),
      code: String(item.code ?? item.woCode ?? `WO-${index + 1}`),
      status: String(item.status ?? 'OPEN'),
      qty: Number(item.qty ?? item.quantity ?? 0) || 0,
      plannedStart: item.plannedStart ? String(item.plannedStart) : undefined,
    }));
    return { count: Number(payload?.count ?? items.length), items, source: 'integration' };
  } catch {
    const fallback = parseFallback();
    return { count: fallback.length, items: fallback, source: 'fallback' };
  }
}

