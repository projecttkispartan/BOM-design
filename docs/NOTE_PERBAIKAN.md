# Catatan Perbaikan — Sistem Kalkulasi BOM

Dokumen ini berisi **temuan** dan **rekomendasi perbaikan** agar Anda bisa improve aplikasi bertahap. Gunakan sebagai checklist.

---

## Perbaikan yang sudah diterapkan (pass ini)

- **Ctrl+Z / Ctrl+Y:** Tidak menangkap shortcut saat fokus di `<input>` atau `<textarea>`, agar undo/redo teks di field tetap diproses browser.
- **Normalisasi data saat update lewat Undo:** `updateBomRowWithUndo` sekarang memanggil `recomputeRow(normalizeBomRow({ ...r, ...updates }))` untuk baris yang diubah, sehingga field terhitung (volCut, dll.) dan format data tetap konsisten dengan reducer.

---

## 1. Integrasi Hook & Komponen (Prioritas Tinggi)

### 1.1 Tabel belum pakai `useTableKeyboardNav`
**Lokasi:** `src/components/ComponentsTable.jsx`  
**Temuan:** Hook `useTableKeyboardNav` sudah ada di `src/hooks/` tetapi **tidak dipakai** di ComponentsTable. Tab, Enter, Arrow, F2, Escape di tabel belum berfungsi seperti Excel.

**Perbaikan:**
- Di `ComponentsTable`, panggil `useTableKeyboardNav({ rowCount: orderedRows.length, columnKeys: [...] })`.
- Pasang `onKeyDown={handleKeyDown}` dan `tabIndex={0}` pada container tabel (atau `<table>`).
- Simpan `focusedCell` dan `editingCell`; untuk setiap sel, pass `isFocused={isCellFocused(rowIndex, colKey)}`, `isEditing={isCellEditing(rowIndex, colKey)}`, `onStartEdit`, `onConfirmEdit`, `onCancelEdit`.

### 1.2 Tabel pakai EditableCell lokal, bukan komponen Excel-like
**Lokasi:** `src/components/ComponentsTable.jsx` (sekitar baris 118)  
**Temuan:** Ada fungsi **lokal** `EditableCell` di dalam file yang hanya support click + blur. Komponen **`src/components/EditableCell.jsx`** (F2, Escape, Tab, Enter, border fokus) **tidak di-import** di ComponentsTable.

**Perbaikan:**
- Import: `import { EditableCell } from './EditableCell';`
- Hapus atau rename fungsi lokal `EditableCell` di ComponentsTable (mis. jadi `SimpleCell` jika tetap dipakai untuk sel yang tidak perlu keyboard).
- Ganti semua pemakaian sel yang perlu “Excel-like” ke `<EditableCell ... isFocused={...} isEditing={...} onStartEdit={...} onConfirmEdit={...} onCancelEdit={...} />` dan sambungkan dengan state dari `useTableKeyboardNav`.

---

## 2. Undo/Redo & Normalisasi Data

### 2.1 Update lewat Undo tidak lewat `recomputeRow` / `normalizeBomRow`
**Lokasi:** `src/App.jsx` (`updateBomRowWithUndo`), `src/context/BomContext.jsx` (reducer `UPDATE_BOM_ROW`)  
**Temuan:**  
- Context saat `UPDATE_BOM_ROW` memakai `recomputeRow(normalizeBomRow({ ...r, ...updates }))`.  
- `updateBomRowWithUndo` memanggil `undoable.execute(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))` lalu `setBomRows(next)`, sehingga **bypass reducer** dan **tidak ada** `normalizeBomRow` / `recomputeRow`.

**Dampak:** Data di state bisa tidak konsisten (field hilang, format beda) dibanding kalau lewat reducer.

**Perbaikan (pilih salah satu):**
- **Opsi A:** Di `updateBomRowWithUndo`, sebelum `setBomRows(next)`, jalankan `next.map(normalizeBomRow)` dan untuk baris yang di-update panggil `recomputeRow`. Import `normalizeBomRow` dari `utils/initialState` dan `recomputeRow` dari `utils/calculations`.
- **Opsi B:** Tetap pakai `updateBomRow` dari context untuk apply update, dan di Context simpan history (UNDO/REDO) di reducer sehingga semua perubahan selalu lewat reducer.

### 2.2 Tambah/Hapus baris tidak masuk history Undo
**Lokasi:** `src/App.jsx` — `handleAddModul`, `handleAddPart`, `removeBomRowWithUndo`  
**Temuan:**  
- **Tambah baris** (addModul, addSubModul, addPart) memakai context langsung, **tidak** lewat `undoable.execute`, jadi Undo hanya mengembalikan **edit sel terakhir**, bukan “sebelum tambah baris”.  
- **Hapus baris** sudah lewat `removeBomRowWithUndo` → `undoable.execute`, jadi hapus bisa di-undo.

**Perbaikan:**
- Untuk **tambah baris**: sebelum panggil `addPart()` / `addModul()` / `addSubModul()`, push state saat ini ke history (mis. dengan memanggil `undoable.execute(prev => [...prev])` tidak mengubah apa pun, atau tambah API `undoable.pushSnapshot()`), **atau** ubah flow jadi “compute newRow di App lalu undoable.execute(prev => [...prev, newRow])” dan panggil `setBomRows` saja (perlu logika bikin newRow sama seperti di reducer).

---

## 3. Unsaved Changes & Metadata

### 3.1 `setMetadata` bisa terpanggil dengan object partial
**Lokasi:** `src/App.jsx` — `setMetadataWithDirty`  
**Temuan:** `BomConfigHeader` memanggil `onChange({ [key]: value })`, jadi yang dikirim object partial. Memanggil `setMetadata(meta)` saja bisa **menimpa** seluruh metadata kalau di context dilakukan `metadata = action.payload` tanpa merge.

**Perbaikan:**
- Pastikan di Context: `SET_METADATA` melakukan merge: `metadata: { ...state.metadata, ...action.payload }`. (Sudah benar di baris 89.)
- Di `setMetadataWithDirty` pastikan tetap memanggil `setMetadata(meta)` dengan object yang sama (merge tetap di reducer). Tidak perlu ubah jika reducer sudah merge.

### 3.2 Judul halaman (document.title) dan beforeunload
**Lokasi:** `src/hooks/useUnsavedChanges.js`  
**Temuan:** `pageTitle` dipakai untuk `document.title` dan beforeunload. Jika user buka banyak tab, semua tab pakai title yang sama; sebelum unload warning sudah ada.

**Improve (opsional):**
- Tambah nama produk di title, mis. `BoM — [MM-1800] MEJA MAKAN` (dari metadata), dan saat dirty: `• BoM — [MM-1800] MEJA MAKAN`.

---

## 4. UseUndoRedo — Sinkronisasi dengan Context

### 4.1 History tidak di-reset setelah Load dari storage
**Lokasi:** `src/hooks/useUndoRedo.js`, `src/context/BomContext.jsx`  
**Temuan:** Saat BomProvider load dari localStorage (useEffect dengan LOAD), `bomRows` berubah dari “luar”. Hook `useUndoRedo(bomRows, setBomRows)` tetap memegang **history lama**; Undo bisa mengembalikan state sebelum load.

**Perbaikan:**
- Setelah load dari storage, panggil `undoable.resetHistory()`.  
- Karena load terjadi di dalam BomProvider, bisa: (1) expose callback `onLoadComplete` dari Provider dan panggil `resetHistory()` di App setelah state pertama kali terisi dari storage, atau (2) di App, useEffect yang depend ke `bomRows` dan sebuah “loadVersion” atau flag dari context, lalu panggil `undoable.resetHistory()` sekali setelah load.

### 4.2 Referensi `bomRows` berubah tiap render
**Lokasi:** `src/App.jsx` — `useUndoRedo(bomRows, setBomRows)`  
**Temuan:** `bomRows` dari context bisa referensi baru tiap render. Hook `useUndoRedo` tidak mensync `history` dari `initialValue`; history hanya bertambah lewat `execute`. Jadi tidak otomatis “reset” hanya karena referensi berubah, tapi tetap perlu atensi saat nanti ada “load” (lihat 4.1).

**Improve (opsional):**
- Jika nanti ada “Load dari server” atau “Reset”, beri satu key/version di context (mis. `dataVersion`) dan saat itu panggil `undoable.resetHistory()` atau ganti key tabel agar hook remount.

---

## 5. Aksesibilitas & Keyboard

### 5.1 Ctrl+Z / Ctrl+Y bisa konflik dengan fokus di input
**Lokasi:** `src/App.jsx` — useEffect keydown  
**Temuan:** Event listener global; saat fokus di TextField (mis. di BomConfigHeader atau di modal), Ctrl+Z bisa di-capture aplikasi untuk Undo, padahal user mungkin ingin undo teks di input.

**Perbaikan:**
- Sebelum panggil `undoable.undo()` / `redo()`, cek: jika `document.activeElement` adalah `input`, `textarea`, atau `[contenteditable]`, **jangan** handle Ctrl+Z / Ctrl+Y (biarkan browser/input yang handle).
- Contoh: `if (e.ctrlKey && e.key === 'z' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) { e.preventDefault(); ... }`.

### 5.2 Tabel belum punya role grid dan aria
**Lokasi:** `src/components/ComponentsTable.jsx`  
**Temuan:** Untuk screen reader dan aksesibilitas, tabel sebaiknya punya `role="grid"`, `aria-rowcount`, `aria-colcount`, dan sel punya `aria-rowindex`, `aria-colindex`.

**Perbaikan:**
- Di `<table>` atau wrapper: `role="grid"`, `aria-rowcount={orderedRows.length}`, `aria-colcount={visibleColumnCount}`.
- Di setiap `<td>`: `aria-rowindex`, `aria-colindex` (sesuai urutan tampil).
- Header: `role="columnheader"`, `aria-sort` jika kolom bisa di-sort.

---

## 6. Performance & Skalabilitas

### 6.1 Banyak baris tanpa virtualisasi
**Lokasi:** `src/components/ComponentsTable.jsx`  
**Temuan:** Semua baris di-render; untuk 200+ baris bisa berat.

**Perbaikan (Sprint 3):**
- Pakai `@tanstack/react-virtual` (atau react-virtual) untuk baris: render hanya baris yang terlihat + buffer kecil.
- Pertahankan sticky header dan sticky kolom (freeze) saat pakai virtual list.

### 6.2 Re-render baris saat state berubah
**Temuan:** Setiap `bomRows` atau `focusedCell` berubah, seluruh body tabel bisa re-render.

**Perbaikan:**
- Bungkus setiap baris dengan `React.memo(ComponentRow)` dan pastikan props (row, onUpdate, dll.) stabil (useCallback di parent).
- Untuk sel, bisa pertimbangkan memo jika satu sel sangat berat.

---

## 7. Edge Case & Validasi

### 7.1 Hapus baris yang punya child
**Lokasi:** `src/context/BomContext.jsx` — `DELETE_BOM_ROW`  
**Temuan:** Saat ini baris dihapus tanpa cek apakah punya child; child bisa jadi “yatim” (parentId mengacu ke id yang sudah tidak ada).

**Perbaikan:**
- Sebelum hapus: jika baris punya child, tampilkan konfirmasi: “Baris ini memiliki sub komponen. Hapus semuanya?” dan saat konfirmasi hapus baris + semua descendant (rekursif filter by parentId).

### 7.2 Validasi angka negatif dan required
**Lokasi:** `src/components/EditableCell.jsx`  
**Temuan:** Ada prop `min` dan `required`; untuk required, saat kosong kita fallback ke `value` lama. Tidak ada pesan error inline.

**Perbaikan:**
- Untuk kolom wajib (mis. QTY), tampilkan state error (border merah + teks “Wajib diisi”) saat blur dan nilai kosong.
- Untuk number, selain `min`, bisa tambah `max` dan tampilkan error jika di luar range.

---

## 8. UX Kecil

### 8.1 Toast “Dibatalkan: Edit QTY baris 2” untuk Undo
**Lokasi:** `src/App.jsx` — handler Ctrl+Z  
**Temuan:** Spesifikasi minta feedback toast saat Undo/Redo; saat ini hanya eksekusi, tanpa toast.

**Perbaikan:**
- Setelah `undoable.undo()` / `redo()`, panggil `showToast('Dibatalkan: …')` atau `showToast('Redo: …')`. Jika mau detail, hook useUndoRedo bisa return `lastAction` atau deskripsi aksi terakhir (mis. “Edit QTY baris 2”).

### 8.2 Simpan dengan animasi “pulse”
**Lokasi:** `src/components/BomHeader.jsx`  
**Temuan:** Ada `animation: pulse` saat `hasChanges`; keyframes `@keyframes pulse` didefinisikan inline. Bisa dipindah ke theme/global style agar konsisten.

**Perbaikan (opsional):**
- Pindah keyframes ke `src/styles/GlobalStyles.jsx` atau theme MUI agar satu tempat dan bisa dipakai ulang.

---

## 9. Ringkasan Checklist Improve

| No | Item | File / area | Prioritas |
|----|------|-------------|-----------|
| 1 | Integrasi useTableKeyboardNav di ComponentsTable | ComponentsTable.jsx | Tinggi |
| 2 | Pakai EditableCell.jsx (Excel-like) di tabel, hapus/rename EditableCell lokal | ComponentsTable.jsx | Tinggi |
| 3 | Normalize/recompute di updateBomRowWithUndo atau pindah undo ke reducer | App.jsx, BomContext | Tinggi |
| 4 | Undo untuk “tambah baris” (push snapshot atau execute dengan newRow) | App.jsx | Sedang |
| 5 | Reset undo history setelah load dari storage | App.jsx, BomProvider | Sedang |
| 6 | Jangan tangkap Ctrl+Z/Ctrl+Y saat fokus di input/textarea | App.jsx | Sedang |
| 7 | Role grid + aria-rowindex/colindex di tabel | ComponentsTable.jsx | Sedang |
| 8 | Konfirmasi hapus baris yang punya child + hapus descendant | BomContext atau ComponentsTable | Sedang |
| 9 | Toast feedback setelah Undo/Redo | App.jsx | Rendah |
| 10 | Virtual scrolling untuk 200+ baris | ComponentsTable.jsx (Sprint 3) | Nanti |

---

**Cara pakai dokumen ini:**  
Selesaikan per item (terutama prioritas tinggi), lalu centang di dokumen atau di task tracker Anda. Jika ada temuan baru, tambahkan di section baru dengan format yang sama (Lokasi, Temuan, Perbaikan).
