# Audit Kesesuaian PRD - Furniture Costing Calculation System

**Tanggal cek:** 09 April 2026  
**Status akhir:** **Perlu Perubahan** (belum 100% sesuai PRD)

## Ringkasan Cepat
Sistem saat ini sudah kuat di struktur BOM, versi, workflow, dan kalkulasi dasar biaya, tetapi belum sesuai penuh dengan PRD yang Anda tulis (khususnya arsitektur, kalkulasi pricing, validasi Zod, dan format export).

## Hasil Crosscheck per Cakupan PRD
| Area PRD | Status | Catatan |
|---|---|---|
| 1. Overview & Objectives | Parsial | Arah sistem sudah ke digital BOM/costing, namun belum ada pemetaan eksplisit goals/non-goals di app. |
| 2. Target User (4 role) | Parsial | Ada role simulator (`engineering`, `ppic`, `procurement`, `supervisor`, `owner`) tapi tidak persis mapping PRD (Costing Staff/Product Manager/Sales/Management). |
| 3. Arsitektur (Next 14 + shadcn + Zustand + TanStack) | **Tidak sesuai** | Project aktif memakai Next 15, Tailwind + komponen custom, tanpa Zustand, tanpa TanStack Table, tanpa shadcn/ui. |
| 4. Data Model & Types (7 interface PRD) | Parsial | Ada `BomMetadata`, `BomRow`, `HardwareRow`, dll, tapi belum mengikuti struktur PRD `ProductIdentity/WoodData/LaborData/...` secara eksplisit. |
| 5. Kalkulasi Engine (26 rumus, 5 modul) | **Tidak sesuai** | Kalkulasi ada di `lib/calculations.ts` (monolit), belum dipisah ke 5 modul PRD dan belum ada formula pricing lengkap (COGS/markup/selling/margin) sesuai PRD. |
| 6. UI Specification (tokens navy+amber, 4 tab) | Parsial | 4 tab utama ada, namun token/layout belum identik PRD. Penanda auto-calc `#EBF5FB` belum ditemukan. |
| 7. State Management (Zustand Persist) | **Tidak sesuai** | Saat ini pakai React Context + useReducer dengan localStorage. |
| 8. Default Data Seed Excel | Parsial | Seed sample ada (contoh MINDI), tapi seed lengkap sesuai PRD (wages, overhead rates, markup options) belum lengkap/terstruktur constants PRD. |
| 9. Validasi & Error Handling (Zod + 5 rules) | **Tidak sesuai** | Validasi inline sudah ada, tetapi belum berbasis Zod schema seperti PRD. |
| 10. Fitur Tambahan | Parsial | Keyboard shortcut, command palette, toast ada. Export ada tetapi outputnya `csv` + `pdf.txt` (bukan PDF/Excel native). Import/Export JSON & print flow belum lengkap sesuai PRD. |
| 11. Rencana Pengembangan 6 phase/8 sprint | N/A di runtime | Tidak bisa divalidasi dari runtime app; ini area dokumen/proyek management. |
| 12. Acceptance Criteria (angka Excel acuan) | **Tidak sesuai** | Belum ada test otomatis/verifikasi angka baku seperti `COGS 1.626.974`, `Selling USD 151.03`, `Margin 16.67%`. |
| 13. Technical Notes (virtual scroll, storage warning 80%) | Parsial | Ada `useMemo`/debounce, tapi belum ada virtual scroll dan belum ada warning kapasitas localStorage >80%. |
| 14. Glossary | N/A di runtime | Tidak menjadi bagian implementasi UI saat ini. |

## Bukti Teknis Utama (Codebase Saat Ini)
- Arsitektur aktif: `package.json` menunjukkan `next: 15.0.3` (bukan Next 14 PRD).
- State saat ini: `context/BomContext.tsx` memakai `useReducer` + `localStorage`.
- Kalkulasi saat ini: terpusat di `lib/calculations.ts`.
- Export saat ini: `lib/bomApiClient.ts` menghasilkan `*.csv` dan `*.pdf.txt` (bukan PDF/XLSX native).
- Shortcut/command: `components/CommandPalette.tsx` + shortcut di `app/bom/[id]/page.tsx`.
- Validasi inline UI: `components/BomConfigHeader.tsx` + validasi save di `app/bom/[id]/page.tsx`.

## Kesimpulan
**Perlu perubahan** jika targetnya adalah patuh PRD secara penuh.  
Jika targetnya demo operasional cepat, sistem saat ini sudah usable, tetapi masih gap signifikan terhadap spesifikasi PRD resmi.

## Prioritas Perubahan yang Disarankan
1. Samakan keputusan arsitektur: ikut PRD (Zustand/TanStack/shadcn) atau revisi PRD agar sesuai implementasi saat ini.
2. Pecah kalkulasi ke modul PRD dan tambah pricing engine (COGS -> selling price -> margin) sesuai formula Excel.
3. Lengkapi export ke XLSX & PDF native + import/export JSON sesuai workflow user.
4. Implementasi validasi berbasis Zod schema untuk data layer.
5. Tambah acceptance test angka acuan PRD.
6. Tambah indikator kapasitas localStorage (>80%) dan fallback handling.
