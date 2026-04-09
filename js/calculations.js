/**
 * BOM calculations: Vol Cutting, Vol Invoice, M Lari, M2, etc.
 * Replicate Excel logic for parity during migration.
 */

/**
 * Vol Cutting (m3) from dimensions A (P,L,T) and qty.
 * Formula: (P * L * T) / 1e9 * qty  (mm -> m3)
 */
export function calcVolCutting(row) {
    const p = parseFloat(row.dimAP) || 0;
    const l = parseFloat(row.dimAL) || 0;
    const t = parseFloat(row.dimAT) || 0;
    const qty = parseFloat(row.qty) || 0;
    if (!p || !l || !t) return '';
    const vol = (p * l * t) / 1e9 * (qty || 1);
    return vol.toFixed(4);
}

/**
 * Vol Invoice (m3) from dimensions D (P,L,T) and qty.
 */
export function calcVolInvoice(row) {
    const p = parseFloat(row.dimDP) || 0;
    const l = parseFloat(row.dimDL) || 0;
    const t = parseFloat(row.dimDT) || 0;
    const qty = parseFloat(row.qty) || 0;
    if (!p || !l || !t) return '';
    const vol = (p * l * t) / 1e9 * (qty || 1);
    return vol.toFixed(5);
}

/**
 * M Lari (linear meters) — simplified: (P or L) in mm / 1000 * qty.
 * Adjust formula when Excel logic is documented.
 */
export function calcMLari(row) {
    const p = parseFloat(row.dimAP) || 0;
    const qty = parseFloat(row.qty) || 0;
    if (!p) return '';
    return ((p / 1000) * (qty || 1)).toFixed(2);
}

/**
 * M2 (square meters) — (P*L)/1e6 * qty for face area.
 */
export function calcM2(row) {
    const p = parseFloat(row.dimAP) || 0;
    const l = parseFloat(row.dimAL) || 0;
    const qty = parseFloat(row.qty) || 0;
    if (!p || !l) return '';
    return (((p * l) / 1e6) * (qty || 1)).toFixed(4);
}

/**
 * Recompute all calculated fields for a BOM row.
 */
export function recomputeRow(row) {
    const out = { ...row };
    out.volCut = calcVolCutting(out);
    out.volInv = calcVolInvoice(out);
    out.mLari = calcMLari(out);
    out.m2 = calcM2(out);
    return out;
}
