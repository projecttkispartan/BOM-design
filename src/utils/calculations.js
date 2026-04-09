export function calcVolCutting(row) {
  const p = parseFloat(row.dimAP) || 0;
  const l = parseFloat(row.dimAL) || 0;
  const t = parseFloat(row.dimAT) || 0;
  const qty = parseFloat(row.qty) || 0;
  if (!p || !l || !t) return '';
  return ((p * l * t) / 1e9 * (qty || 1)).toFixed(4);
}

export function calcVolInvoice(row) {
  const p = parseFloat(row.dimDP) || 0;
  const l = parseFloat(row.dimDL) || 0;
  const t = parseFloat(row.dimDT) || 0;
  const qty = parseFloat(row.qty) || 0;
  if (!p || !l || !t) return '';
  return ((p * l * t) / 1e9 * (qty || 1)).toFixed(5);
}

export function calcMLari(row) {
  const p = parseFloat(row.dimAP) || 0;
  const qty = parseFloat(row.qty) || 0;
  if (!p) return '';
  return ((p / 1000) * (qty || 1)).toFixed(2);
}

export function calcM2(row) {
  const p = parseFloat(row.dimAP) || 0;
  const l = parseFloat(row.dimAL) || 0;
  const qty = parseFloat(row.qty) || 0;
  if (!p || !l) return '';
  return (((p * l) / 1e6) * (qty || 1)).toFixed(4);
}

export function recomputeRow(row) {
  const out = { ...row };
  out.volCut = calcVolCutting(out);
  out.volInv = calcVolInvoice(out);
  out.mLari = calcMLari(out);
  out.m2 = calcM2(out);
  return out;
}
