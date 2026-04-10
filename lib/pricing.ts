import type { BomMetadata } from '@/types';

const DEFAULT_MARKUP_PERCENT = 16.67;
const DEFAULT_USD_RATE = 16000;

function num(value: unknown): number {
  return Number.parseFloat(String(value ?? '')) || 0;
}

function clampMarkup(value: number): number {
  if (!Number.isFinite(value) || value < 0) return DEFAULT_MARKUP_PERCENT;
  if (value >= 100) return 99.99;
  return value;
}

export interface PricingSnapshot {
  cogs: number;
  markupPercent: number;
  sellingPrice: number;
  marginPercent: number;
  usdRate: number;
  cogsUsd: number;
  sellingPriceUsd: number;
}

export function calculateSellingPrice(cogs: number, markupPercent: number): number {
  const safeCogs = Math.max(0, cogs);
  const safeMarkup = clampMarkup(markupPercent);
  const divisor = 1 - safeMarkup / 100;
  if (divisor <= 0) return safeCogs;
  // PRD formula: selling = COGS / (1 - markup%)
  return safeCogs / divisor;
}

export function calculateMarginPercent(cogs: number, sellingPrice: number): number {
  const safeSelling = Math.max(0, sellingPrice);
  const safeCogs = Math.max(0, cogs);
  if (safeSelling <= 0) return 0;
  return ((safeSelling - safeCogs) / safeSelling) * 100;
}

export function readMarkupPercent(metadata?: Partial<BomMetadata>): number {
  const raw = num(metadata?.markupPercent);
  if (raw <= 0 || raw >= 100) return DEFAULT_MARKUP_PERCENT;
  return raw;
}

export function readUsdRate(metadata?: Partial<BomMetadata>): number {
  const raw = num(metadata?.usdRate);
  if (raw <= 0) return DEFAULT_USD_RATE;
  return raw;
}

export function computePricingFromCogs(
  cogs: number,
  options?: { markupPercent?: number; usdRate?: number },
): PricingSnapshot {
  const safeCogs = Math.max(0, cogs);
  const markupPercent = clampMarkup(options?.markupPercent ?? DEFAULT_MARKUP_PERCENT);
  const usdRate = options?.usdRate && options.usdRate > 0 ? options.usdRate : DEFAULT_USD_RATE;
  const sellingPrice = calculateSellingPrice(safeCogs, markupPercent);
  const marginPercent = calculateMarginPercent(safeCogs, sellingPrice);
  return {
    cogs: safeCogs,
    markupPercent,
    sellingPrice,
    marginPercent,
    usdRate,
    cogsUsd: safeCogs / usdRate,
    sellingPriceUsd: sellingPrice / usdRate,
  };
}

export function computePricingFromMetadata(cogs: number, metadata?: Partial<BomMetadata>): PricingSnapshot {
  return computePricingFromCogs(cogs, {
    markupPercent: readMarkupPercent(metadata),
    usdRate: readUsdRate(metadata),
  });
}
