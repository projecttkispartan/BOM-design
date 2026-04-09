# Rencana Implementasi Bertahap — Sistem Kalkulasi BOM

## Sprint 1: Kritikal (Excel-like core) — Estimasi 1–2 minggu

Fokus: inline editing, navigasi keyboard, undo/redo, unsaved changes. Langsung dirasakan user.

| No | Fitur | Deliverable |
|----|-------|-------------|
| 1.1 | Inline cell editing (single/double click, F2, Escape, Tab, Enter) | EditableCell + integrasi di tabel |
| 1.2 | Keyboard navigation (Tab, Shift+Tab, Enter, Arrow, F2, Escape) | useTableKeyboardNav |
| 1.3 | Undo / Redo (min 20 level, Ctrl+Z / Ctrl+Y) | useUndoRedo |
| 1.4 | Unsaved changes (dirty indicator, Simpan counter, title dot, beforeunload) | useUnsavedChanges |
| 1.5 | Integrasi: tabel utama pakai semua hook di atas | Refactor ComponentsTable |

**Definition of Done Sprint 1:** User bisa edit sel seperti Excel, pindah dengan Tab/Enter/Arrow, undo/redo, dan melihat ada perubahan belum disimpan.

---

## Sprint 2: Produktivitas — Estimasi 1–2 minggu

| No | Fitur | Deliverable |
|----|-------|-------------|
| 2.1 | Freeze columns (NO, KODE, NAMA sticky) | CSS sticky + shadow |
| 2.2 | Column sort & filter per header | Sort state + filter dropdown |
| 2.3 | Column resize (drag border, min 60px, simpan ke localStorage) | Resize handles + state lebar |
| 2.4 | Row operations: context menu (tambah/hapus/duplikat/pindah) | RowContextMenu |
| 2.5 | Copy/Paste baris (Ctrl+C / Ctrl+V) | useTableKeyboardNav + clipboard |
| 2.6 | Expand/Collapse keyboard (Alt+Shift+→/←) | Di useTableKeyboardNav |

---

## Sprint 3: Polish & Performa — Estimasi ~1 minggu

| No | Fitur | Deliverable |
|----|-------|-------------|
| 3.1 | Virtual scrolling (react-virtual) untuk 200+ baris | TableBody virtualized |
| 3.2 | Light/Dark mode (toggle, simpan preferensi) | Theme context + MUI theme |
| 3.3 | Column visibility toggle + preset (Standar, Biaya, Dimensi) | Sudah ada dasar; tambah preset |
| 3.4 | Auto-save draft 30 detik + notifikasi | Di useUnsavedChanges |
| 3.5 | Memo row component, debounce filter 300ms | React.memo, useDeferredValue/debounce |
| 3.6 | Validasi inline (angka ≥ 0, required) | Di EditableCell / submit |

---

## Prioritas Jika Waktu Terbatas

1. **Harus:** Sprint 1 (editing + keyboard + undo + unsaved).
2. **Sangat disarankan:** Freeze kolom, context menu baris, copy/paste baris.
3. **Nice to have:** Virtual scroll, light mode, preset kolom.
