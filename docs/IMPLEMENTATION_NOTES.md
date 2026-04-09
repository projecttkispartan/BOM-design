# Catatan Implementasi & Edge Case

## Edge Case

1. **Undo setelah Load:** Setelah data dimuat dari localStorage/API, panggil `resetHistory()` pada hook undo agar history tidak mengacu ke state lama.
2. **Fokus sel saat baris dihapus:** Jika baris yang sedang fokus dihapus, pindahkan fokus ke baris sebelumnya atau ke sel pertama.
3. **Paste baris:** Format clipboard (misal CSV atau JSON) perlu disepakati; paste baris bisa menambah N baris di bawah baris aktif.
4. **Validasi angka:** EditableCell dengan `type="number"` dan `min={0}` akan memaksa nilai ke min saat blur; untuk "required" tampilkan error inline, jangan kosongkan paksa.
5. **Hierarki + Sort/Filter:** Saat sort/filter aktif, child harus selalu mengikuti parent (parent visible ⇒ child ikut; parent hidden ⇒ child hidden).
6. **Virtual scroll + sticky header:** Pastikan thead sticky dan baris virtualized align; hitung tinggi baris tetap (misal 40px) agar scroll akurat.

## Aksesibilitas

- Beri `role="grid"`, `aria-rowcount`, `aria-colcount` pada tabel.
- Setiap sel: `role="gridcell"`, `aria-colindex`, `aria-rowindex` (atau row/col index dalam data).
- Header: `role="columnheader"`, `aria-sort` saat kolom di-sort.
- Umumkan ke screen reader saat fokus pindah: "Baris 2, Kolom Nama".

## Rekomendasi Library

| Kebutuhan | Rekomendasi | Alasan |
|-----------|-------------|--------|
| Virtual list | @tanstack/react-virtual | Ringan, API sederhana, mendukung fixed height dan variable height |
| Clipboard (paste parsing) | Custom + `navigator.clipboard.readText()` | Kontrol format (tab/coma-separated) untuk paste multi-sel |
| Resize kolom | Custom (onMouseDown/Move/Up) | Simpel, simpan lebar ke localStorage per kolom |

## Integrasi Undo dengan Context

- Gunakan `useUndoRedo(bomRows, setBomRows)` di komponen yang me-render tabel (misal di App atau di tab Components).
- Untuk setiap **edit sel** panggil `undoable.execute(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))` alih-alih langsung `updateBomRow(id, updates)`.
- Untuk **tambah/hapus baris** bisa tetap pakai `addPart`/`removeBomRow` dari context; agar bisa di-undo, lakukan `undoable.execute(prev => [...prev, newRow])` atau `prev.filter(r => r.id !== id)` dan panggil `setBomRows` (atau tambah action di context yang push history).

## Integrasi Unsaved Changes

- Panggil `markChanged()` setiap kali `updateBomRow`, `addPart`, `removeBomRow`, atau `setMetadata` mengubah data.
- Panggil `markSaved()` setelah save ke localStorage/API berhasil.
- Tampilkan `changeCount` di tombol Simpan: "Simpan (3 perubahan)".
