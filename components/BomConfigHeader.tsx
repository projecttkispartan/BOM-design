'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, Calculator, Eye, EyeOff, ImagePlus, Clock3, Ruler, PackageCheck, Wallet } from 'lucide-react';
import type { BomMetadata } from '@/types';

interface BomConfigHeaderProps {
  metadata: BomMetadata;
  onChange: (meta: Partial<BomMetadata>) => void;
  onSave?: () => void;
  onHitungBom?: () => void;
  saveValidationToken?: number;
}

const INPUT_COMPACT =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200';
const SELECT_COMPACT =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 appearance-none';

const ITEM_TYPES = ['', 'CHAIR', 'TABLE', 'CABINET', 'BED', 'SHELF', 'DRAWER', 'BENCH', 'DESK', 'OTHER'];
const PRODUCT_TYPES: Array<NonNullable<BomMetadata['productType']>> = ['Standard', 'Custom', 'Export', 'OEM'];
const INPUT_MODES = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual' },
];
const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
];

function validateMetadata(meta: BomMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!meta.productCode?.trim()) errors.push('Kode produk wajib diisi');
  if (!meta.productName?.trim()) errors.push('Nama produk wajib diisi');
  if (!meta.itemType?.trim()) errors.push('Tipe item wajib dipilih');
  if (!meta.productType?.trim()) errors.push('Tipe produk wajib dipilih');
  if (!meta.customer?.trim()) errors.push('Customer wajib diisi');
  if (!meta.buyerCode?.trim()) errors.push('Buyer wajib diisi');
  if (!meta.leadTime?.trim()) errors.push('Lead Time wajib diisi');

  const qty = parseFloat(meta.bomQuantity || '0');
  if (qty <= 0) errors.push('QTY harus lebih dari 0');

  const width = parseFloat(meta.itemWidth || '0');
  const depth = parseFloat(meta.itemDepth || '0');
  const height = parseFloat(meta.itemHeight || '0');

  if (width <= 0) errors.push('Lebar harus lebih dari 0 mm');
  if (depth <= 0) errors.push('Kedalaman harus lebih dari 0 mm');
  if (height <= 0) errors.push('Tinggi harus lebih dari 0 mm');

  if (meta.effectiveDate && meta.expiryDate) {
    const effDate = new Date(meta.effectiveDate);
    const expDate = new Date(meta.expiryDate);
    if (expDate <= effDate) errors.push('Expiry Date harus lebih besar dari Effective Date');
  }

  return { valid: errors.length === 0, errors };
}

function getFieldErrors(meta: BomMetadata): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!meta.productCode?.trim()) errors.productCode = 'Field ini wajib diisi';
  if (!meta.productName?.trim()) errors.productName = 'Field ini wajib diisi';
  if (!meta.itemType?.trim()) errors.itemType = 'Field ini wajib dipilih';
  if (!meta.productType?.trim()) errors.productType = 'Field ini wajib dipilih';
  if (!meta.customer?.trim()) errors.customer = 'Field ini wajib diisi';
  if (!meta.buyerCode?.trim()) errors.buyerCode = 'Field ini wajib diisi';
  if (!meta.leadTime?.trim()) errors.leadTime = 'Field ini wajib diisi';
  if ((parseFloat(meta.bomQuantity || '0') || 0) <= 0) errors.bomQuantity = 'Nilai harus lebih dari 0';
  if ((parseFloat(meta.itemWidth || '0') || 0) <= 0) errors.itemWidth = 'Nilai harus lebih dari 0';
  if ((parseFloat(meta.itemDepth || '0') || 0) <= 0) errors.itemDepth = 'Nilai harus lebih dari 0';
  if ((parseFloat(meta.itemHeight || '0') || 0) <= 0) errors.itemHeight = 'Nilai harus lebih dari 0';
  if (meta.effectiveDate && meta.expiryDate) {
    const effDate = new Date(meta.effectiveDate);
    const expDate = new Date(meta.expiryDate);
    if (expDate <= effDate) errors.expiryDate = 'Expiry Date harus lebih besar dari Effective Date';
  }
  return errors;
}

export function BomConfigHeader({ metadata, onChange, onHitungBom, saveValidationToken = 0 }: BomConfigHeaderProps) {
  const [showDetailFields, setShowDetailFields] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const currency = metadata?.currency ?? 'IDR';
  const validation = validateMetadata(metadata);
  const fieldErrors = useMemo(() => getFieldErrors(metadata), [metadata]);
  const isValid = validation.valid;
  const isExpired = Boolean(metadata?.expiryDate && new Date(metadata.expiryDate) < new Date());
  const productImageUrl = typeof metadata?.productImageUrl === 'string' ? metadata.productImageUrl : '';

  const handleChange = (key: string, value: string) => {
    if (key === 'productCode' || key === 'productName') {
      const next = { ...metadata, [key]: value } as BomMetadata;
      const nextDisplay = `[${next.productCode || ''}] ${next.productName || ''}`.trim();
      onChange({ ...next, productDisplay: nextDisplay });
      return;
    }
    onChange({ [key]: value });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange({ productImageUrl: reader.result });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const getFieldId = (field: string) => `bom-field-${field}`;
  const getInputClass = (field: string, base: string) =>
    `${base} ${showFieldErrors && fieldErrors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`;
  const renderFieldError = (field: string) =>
    showFieldErrors && fieldErrors[field] ? <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors[field]}</p> : null;

  useEffect(() => {
    if (!saveValidationToken) return;
    setShowFieldErrors(true);
    if (Object.keys(fieldErrors).length === 0) return;
    setShowDetailFields(true);
    const order = [
      'productCode',
      'productName',
      'itemType',
      'productType',
      'bomQuantity',
      'customer',
      'buyerCode',
      'itemWidth',
      'itemDepth',
      'itemHeight',
      'leadTime',
      'expiryDate',
    ];
    const firstField = order.find((field) => fieldErrors[field]);
    if (!firstField) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(getFieldId(firstField));
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (target as HTMLInputElement | null)?.focus?.();
    });
  }, [fieldErrors, saveValidationToken]);

  return (
    <div className="flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="p-2">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 xl:w-52">
              {productImageUrl ? (
                <img src={productImageUrl} alt="Product preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-500">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Belum ada gambar produk</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="absolute bottom-1 right-1 rounded-md border border-white/70 bg-slate-900/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur hover:bg-slate-900"
              >
                Upload
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                  {metadata?.productCode || 'NO-CODE'}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {metadata?.productType || 'Standard'}
                </span>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  {metadata?.bomInputMode === 'manual' ? 'Manual Input' : 'Auto Input'}
                </span>
                {isExpired && (
                  <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    EXPIRED
                  </span>
                )}
              </div>
              <h2 className="truncate text-base font-semibold text-slate-900">
                {metadata?.productName || 'Nama produk belum diisi'}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Customer: <span className="font-medium text-slate-800">{metadata?.customer || '-'}</span> | Buyer:{' '}
                <span className="font-medium text-slate-800">{metadata?.buyerCode || '-'}</span> | Lead Time:{' '}
                <span className="font-medium text-slate-800">{metadata?.leadTime || '-'} hari</span>
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                    <PackageCheck className="h-3 w-3" /> Qty BOM
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{metadata?.bomQuantity || '1'} {metadata?.bomUnit || 'EA'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                    <Ruler className="h-3 w-3" /> Dimensi
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {metadata?.itemWidth || '-'} x {metadata?.itemDepth || '-'} x {metadata?.itemHeight || '-'} mm
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                    <Clock3 className="h-3 w-3" /> Efektif
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{metadata?.effectiveDate || '-'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                    <Wallet className="h-3 w-3" /> Currency
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{currency}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 xl:items-end">
              <button
                type="button"
                onClick={() => setShowDetailFields((value) => !value)}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showDetailFields ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showDetailFields ? 'Sembunyikan Field' : 'Tampilkan Field'}
              </button>
              {onHitungBom && (
                <button
                  onClick={onHitungBom}
                  disabled={!isValid}
                  className={`inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                    isValid
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'cursor-not-allowed bg-slate-300 text-slate-500'
                  }`}
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Hitung
                </button>
              )}
            </div>
          </div>

          {!isValid && (
            <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold">
                  {validation.errors.length} field wajib belum terisi.
                </div>
                {!showDetailFields && <div>Buka "Tampilkan Field" untuk melengkapi data.</div>}
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(fieldErrors).map(([field, message]) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => {
                        setShowDetailFields(true);
                        setShowFieldErrors(true);
                        const target = document.getElementById(getFieldId(field));
                        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        (target as HTMLInputElement | null)?.focus?.();
                      }}
                      className="rounded border border-amber-300 bg-white px-1.5 py-0.5 text-[10px] text-amber-900 hover:bg-amber-100"
                    >
                      {message}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {showDetailFields && (
          <div className="mt-2 grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">Identitas</div>
              <div className="space-y-1">
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Kode *</label>
                  <input
                    id={getFieldId('productCode')}
                    type="text"
                    value={metadata?.productCode ?? ''}
                    onChange={(e) => handleChange('productCode', e.target.value)}
                    className={getInputClass('productCode', INPUT_COMPACT)}
                    placeholder="MB-001"
                  />
                  {renderFieldError('productCode')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Nama *</label>
                  <input
                    id={getFieldId('productName')}
                    type="text"
                    value={metadata?.productName ?? ''}
                    onChange={(e) => handleChange('productName', e.target.value)}
                    className={getInputClass('productName', INPUT_COMPACT)}
                    placeholder="MEJA MAKAN"
                  />
                  {renderFieldError('productName')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Tipe Item *</label>
                  <select
                    id={getFieldId('itemType')}
                    value={metadata?.itemType ?? ''}
                    onChange={(e) => handleChange('itemType', e.target.value)}
                    className={getInputClass('itemType', SELECT_COMPACT)}
                  >
                    {ITEM_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item || '-'}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('itemType')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Tipe Produk *</label>
                  <select
                    id={getFieldId('productType')}
                    value={metadata?.productType ?? 'Standard'}
                    onChange={(e) => handleChange('productType', e.target.value)}
                    className={getInputClass('productType', SELECT_COMPACT)}
                  >
                    {PRODUCT_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('productType')}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-blue-50 p-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">Data Utama</div>
              <div className="space-y-1">
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Qty *</label>
                  <input
                    id={getFieldId('bomQuantity')}
                    type="number"
                    min={1}
                    value={metadata?.bomQuantity ?? '1'}
                    onChange={(e) => handleChange('bomQuantity', e.target.value)}
                    className={getInputClass('bomQuantity', INPUT_COMPACT)}
                  />
                  {renderFieldError('bomQuantity')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Uang</label>
                  <select
                    value={currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className={SELECT_COMPACT}
                  >
                    {CURRENCY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Mode Input</label>
                  <div className="grid grid-cols-2 gap-1">
                    {INPUT_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => handleChange('bomInputMode', mode.value)}
                        className={`rounded-md py-1 text-[10px] font-semibold transition ${
                          metadata?.bomInputMode === mode.value
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">Info Lain</div>
              <div className="space-y-1">
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Customer *</label>
                  <input
                    id={getFieldId('customer')}
                    type="text"
                    value={metadata?.customer ?? ''}
                    onChange={(e) => handleChange('customer', e.target.value)}
                    className={getInputClass('customer', INPUT_COMPACT)}
                    placeholder="PT ABC"
                  />
                  {renderFieldError('customer')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Buyer *</label>
                  <input
                    id={getFieldId('buyerCode')}
                    type="text"
                    value={metadata?.buyerCode ?? ''}
                    onChange={(e) => handleChange('buyerCode', e.target.value)}
                    className={getInputClass('buyerCode', INPUT_COMPACT)}
                    placeholder="BYR-001"
                  />
                  {renderFieldError('buyerCode')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Coating</label>
                  <input
                    type="text"
                    value={metadata?.coatingColor ?? ''}
                    onChange={(e) => handleChange('coatingColor', e.target.value)}
                    className={INPUT_COMPACT}
                    placeholder="Natural"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-amber-50 p-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">Dimensi (MM) *</div>
              <div className="space-y-1">
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">W</label>
                  <input
                    id={getFieldId('itemWidth')}
                    type="number"
                    value={metadata?.itemWidth ?? ''}
                    onChange={(e) => handleChange('itemWidth', e.target.value)}
                    className={getInputClass('itemWidth', INPUT_COMPACT)}
                    placeholder="1200"
                  />
                  {renderFieldError('itemWidth')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">D</label>
                  <input
                    id={getFieldId('itemDepth')}
                    type="number"
                    value={metadata?.itemDepth ?? ''}
                    onChange={(e) => handleChange('itemDepth', e.target.value)}
                    className={getInputClass('itemDepth', INPUT_COMPACT)}
                    placeholder="600"
                  />
                  {renderFieldError('itemDepth')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">H</label>
                  <input
                    id={getFieldId('itemHeight')}
                    type="number"
                    value={metadata?.itemHeight ?? ''}
                    onChange={(e) => handleChange('itemHeight', e.target.value)}
                    className={getInputClass('itemHeight', INPUT_COMPACT)}
                    placeholder="750"
                  />
                  {renderFieldError('itemHeight')}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-violet-50 p-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">Tanggal & Lead</div>
              <div className="space-y-1">
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Lead Time (Hari) *</label>
                  <input
                    id={getFieldId('leadTime')}
                    type="number"
                    min="0"
                    value={metadata?.leadTime ?? ''}
                    onChange={(e) => handleChange('leadTime', e.target.value)}
                    className={getInputClass('leadTime', INPUT_COMPACT)}
                    placeholder="7"
                  />
                  {renderFieldError('leadTime')}
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Efektif</label>
                  <input
                    type="date"
                    value={metadata?.effectiveDate ?? ''}
                    onChange={(e) => handleChange('effectiveDate', e.target.value)}
                    className={INPUT_COMPACT}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-600">Expired</label>
                  <input
                    id={getFieldId('expiryDate')}
                    type="date"
                    value={metadata?.expiryDate ?? ''}
                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                    className={getInputClass('expiryDate', INPUT_COMPACT)}
                  />
                  {renderFieldError('expiryDate')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
