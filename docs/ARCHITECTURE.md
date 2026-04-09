# Arsitektur Komponen — Sistem Kalkulasi BOM

## Stack Teknologi (aktual)
- **Frontend:** React 18 (Vite)
- **Styling:** MUI (Material-UI) + Emotion (styled-components)
- **State Management:** React Context + useReducer (BomContext)
- **Data:** Local state + localStorage (draft), siap untuk REST API/ERPNext

---

## Diagram Struktur Komponen

```
App
├── BomProvider (Context: bomRows, metadata, actions)
├── BomHeader (Simpan, Hitung BOM, Pengaturan)
├── BomConfigHeader (Product, Variant, Qty, Reference, BoM Type, Company)
├── Tabs (Components | Operations | Miscellaneous)
│   ├── ComponentsTab
│   │   ├── ComponentsTable  ← Tabel utama (Excel-like)
│   │   │   ├── useTableKeyboardNav   (fokus sel, Tab/Enter/Arrow)
│   │   │   ├── useUndoRedo           (Ctrl+Z / Ctrl+Y)
│   │   │   ├── useUnsavedChanges     (dirty flag, auto-save)
│   │   │   ├── TableToolbar          (Tambah baris, Catalog, Kolom)
│   │   │   ├── TableHeader           (sticky, resize, sort, filter)
│   │   │   ├── TableBody (virtualized)
│   │   │   │   └── TableRow (memo)
│   │   │   │       └── EditableCell  (inline edit, F2, Escape, type)
│   │   │   ├── RowDetailDrawer       (klik baris → panel detail)
│   │   │   └── RowContextMenu        (klik kanan)
│   │   └── (future: ColumnVisibility, Freeze config)
│   ├── OperationsTab
│   └── MiscellaneousTab (HardwareTable)
├── CommandPalette (Ctrl+K)
├── KalkulasiDialog
└── Snackbar / Toasts
```

---

## Custom Hooks

| Hook | Tanggung jawab | Dipakai oleh |
|------|----------------|--------------|
| **useTableKeyboardNav** | Fokus sel (rowIndex, colKey), Tab/Enter/Arrow, F2, Escape, Copy/Paste baris | ComponentsTable |
| **useUndoRedo** | History stack (min 20), undo/redo, execute(patch) | ComponentsTable (+ BomContext) |
| **useUnsavedChanges** | Dirty tracking, counter, title dot, beforeunload, auto-save draft | App / ComponentsTable |
| **useBom** | Akses state & actions dari BomContext | Semua yang butuh bomRows/metadata |

---

## State Management

- **BomContext (useReducer):** Sumber kebenaran untuk `metadata`, `bomRows`, `hardwareRows`. Actions: SET_METADATA, UPDATE_BOM_ROW, DELETE_BOM_ROW, ADD_MODUL, ADD_PART, SET_BOM_ROWS, dll.
- **Undo/Redo:** Bisa di dalam Context (reducer UNDO/REDO + history di state) atau hook terpisah yang membungkus `setBomRows` dan menyimpan snapshot `bomRows` (rekomendasi: hook terpisah agar Context tetap sederhana).
- **Unsaved:** Flag `hasUnsavedChanges` + counter bisa di Context atau di hook yang mendengarkan perubahan bomRows/metadata.

---

## Alur Data

1. **Edit sel:** EditableCell onBlur/onConfirm → `updateBomRow(id, { field: value })` → Context dispatch UPDATE_BOM_ROW.
2. **Undo:** useUndoRedo menyimpan snapshot `bomRows` sebelum setiap batch update; Undo memanggil `setBomRows(prevSnapshot)`.
3. **Simpan:** `saveToStorage()` menulis ke localStorage; jika nanti ada API, panggil API lalu clear dirty.
4. **Keyboard:** useTableKeyboardNav mengatur fokus (data-* atribut), EditableCell merespons F2/Enter/Escape/Tab.

---

## Rekomendasi Library Pihak Ketiga

| Kebutuhan | Library | Alasan |
|-----------|---------|--------|
| Virtual scrolling | @tanstack/react-virtual | Ringan, mendukung tabel dengan banyak baris (200+) |
| Copy/paste sel | Custom + Clipboard API | Kontrol penuh format (Excel-like paste) |
| Resize kolom | Custom (mousedown/move/up) | Simpel, simpan lebar ke localStorage |

---

## Catatan Aksesibilitas

- Setiap sel fokus harus bisa di-focus (tabIndex, atau programmatic focus).
- Role `grid`, `gridcell`, `row` untuk tabel; aria-label untuk header.
- Keyboard: semua aksi (edit, navigasi, undo, simpan) harus bisa dari keyboard.
- Screen reader: umumkan "Baris X, Kolom Y" saat fokus pindah.
