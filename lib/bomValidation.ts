import type { BomMetadata, BomRow, PackingInfo, PackingRow } from '@/types';

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

interface ValidateBomPayload {
  metadata: BomMetadata;
  bomRows: BomRow[];
  packingRows?: PackingRow[];
  packingInfo?: PackingInfo;
}

function num(value: unknown): number {
  return Number.parseFloat(String(value ?? '')) || 0;
}

function requiredText(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

export function validateBomForSave(payload: ValidateBomPayload): ValidationResult {
  const { metadata, bomRows, packingRows = [], packingInfo } = payload;
  const issues: ValidationIssue[] = [];

  if (!requiredText(metadata.productCode)) {
    issues.push({ code: 'required_product_code', message: 'Kode produk wajib diisi' });
  }
  if (!requiredText(metadata.productName)) {
    issues.push({ code: 'required_product_name', message: 'Nama produk wajib diisi' });
  }
  if (!requiredText(metadata.itemType)) {
    issues.push({ code: 'required_item_type', message: 'Tipe item wajib dipilih' });
  }
  if (!requiredText(metadata.productType)) {
    issues.push({ code: 'required_product_type', message: 'Tipe produk wajib dipilih' });
  }
  if (!requiredText(metadata.customer)) {
    issues.push({ code: 'required_customer', message: 'Customer wajib diisi' });
  }
  if (!requiredText(metadata.buyerCode)) {
    issues.push({ code: 'required_buyer_code', message: 'Buyer wajib diisi' });
  }
  if (!requiredText(metadata.leadTime)) {
    issues.push({ code: 'required_lead_time', message: 'Lead time wajib diisi' });
  }

  if (num(metadata.bomQuantity) <= 0) {
    issues.push({ code: 'invalid_bom_quantity', message: 'QTY BOM harus lebih dari 0' });
  }
  if (num(metadata.itemWidth) <= 0 || num(metadata.itemDepth) <= 0 || num(metadata.itemHeight) <= 0) {
    issues.push({ code: 'invalid_item_dimension', message: 'Dimensi item (P/L/T) harus lebih dari 0' });
  }

  if (metadata.effectiveDate && metadata.expiryDate) {
    const effective = new Date(metadata.effectiveDate);
    const expiry = new Date(metadata.expiryDate);
    if (!Number.isNaN(effective.getTime()) && !Number.isNaN(expiry.getTime()) && expiry <= effective) {
      issues.push({ code: 'invalid_expiry_date', message: 'Expiry Date harus lebih besar dari Effective Date' });
    }
  }

  if (!Array.isArray(bomRows) || bomRows.length === 0) {
    issues.push({ code: 'empty_bom_rows', message: 'Minimal harus ada 1 baris BOM' });
  }

  const partRows = bomRows.filter((row) => row.levelNum >= 2);
  const invalidQtyRows = partRows.filter((row) => num(row.qty) <= 0);
  if (invalidQtyRows.length > 0) {
    issues.push({ code: 'invalid_part_qty', message: 'Qty komponen part harus lebih dari 0' });
  }

  const codeSet = new Set<string>();
  const duplicateCodes = new Set<string>();
  partRows.forEach((row) => {
    const code = String(row.partCode ?? '').trim().toUpperCase();
    if (!code) return;
    if (codeSet.has(code)) duplicateCodes.add(code);
    codeSet.add(code);
  });
  if (duplicateCodes.size > 0) {
    issues.push({ code: 'duplicate_part_code', message: `Kode part duplikat: ${Array.from(duplicateCodes).join(', ')}` });
  }

  const isKit = String(metadata.bomType ?? '').toLowerCase() === 'kit';
  if (isKit) {
    if (!packingRows.length) {
      issues.push({ code: 'kit_packing_required', message: 'Packing wajib diisi untuk BOM tipe Kit' });
    }
    if (!packingInfo || num(packingInfo.outerBoxP) <= 0 || num(packingInfo.outerBoxL) <= 0 || num(packingInfo.outerBoxT) <= 0) {
      issues.push({ code: 'kit_outer_box_required', message: 'Dimensi outer box wajib diisi untuk BOM tipe Kit' });
    }
    if (!packingInfo || num(packingInfo.netWeight) <= 0) {
      issues.push({ code: 'kit_net_weight_required', message: 'Net weight wajib diisi untuk BOM tipe Kit' });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
