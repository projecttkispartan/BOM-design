# BOM Calculation Flow Implementation

Dokumentasi implementasi alur kalkulasi Bill of Material sesuai dengan flowchart yang telah ditentukan.

## 1. Fase Inisialisasi

### 1.1 Mulai Pembuatan BOM
- **Akses**: Halaman daftar BOM (`/page.tsx`)
- **Aksi**: Klik tombol "BOM Baru"
- **Output**: Dokumen BOM kosong siap untuk diisi

### 1.2 Pilih / Setup Product
- **Komponen**: `BomConfigHeader`
- **Input Fields**:
  - **Kode Produk** (`productCode`)
  - **Nama Produk** (`productName`)
  - **Tipe Item** (`itemType`) - CHAIR, TABLE, CABINET, BED, SHELF, DRAWER, BENCH, DESK
  - **QTY** (`bomQuantity`) - Jumlah unit yang akan diproduksi
  - **Buyer** (`buyerCode`) - Kode pembeli
  - **Customer** (`customer`) - Nama pelanggan
  - **Dimensi Utama** (`itemWidth`, `itemDepth`, `itemHeight`) - P × L × T dalam mm

### 1.3 Tentukan Mata Uang
- **Option**: IDR (Rp) atau USD ($)
- **Stored**: `metadata.currency`

---

## 2. Fase Penambahan Komponen (Hierarki)

### 2.1 Struktur Hierarki Komponen

```
LEVEL 0: MODUL (Module)
├── LEVEL 1: SUB MODUL (Submodule)
│   ├── LEVEL 2: PART (Part/Bahan)
│   │   └── LEVEL 3: OPERATION (Operasi/Proses)
│   └── [Treatment Opsional]
├── [Treatment Opsional]
```

### 2.2 Proses Penambahan Komponen

#### A. Tambah Level Modul
- **Aksi**: Klik "Tambah Modul"
- **Input**:
  - Kode: `MOD-001`
  - Deskripsi: Nama modul (cth: "RANGKA", "TOP TABLE")
  - QTY: 1 (default untuk modul)
  - Unit: SET atau EA
- **Perhitungan**: 
  - Volume = (Panjang × Lebar × Tebal × QTY) / 1e9 m³
  - Biaya Modul = SUM(Submodul + Part + Operation di bawahnya)

#### B. Tambah Level Sub Modul (di bawah Modul)
- **Aksi**: Pilih parent Modul → "Tambah Sub Modul"
- **Input**:
  - Kode: `MOD-001.001`
  - Deskripsi: (cth: "BAGIAN KAKI" di bawah "RANGKA")
  - QTY: Jumlah sub modul
  - Unit: SET atau EA
- **Perhitungan**:
  - Volume Sub Modul = (Panjang × Lebar × Tebal × QTY) / 1e9 m³
  - Biaya Sub Modul = SUM(Part + Operation di bawahnya)

#### C. Tambah Level Part (di bawah Sub Modul atau Modul)
- **Aksi**: Pilih parent → "Tambah Part"
- **Input**:
  - **Identitas**:
    - Kode: `MAT-001`
    - Deskripsi: Nama bagian (cth: "KAYU KAKI 3cm x 5cm")
    - Material: Pilih dari master (KAYU SOLID, MDF, PLYWOOD, dll)
    - Jenis: Tipe material
    - Grade: Kualitas material
    - QTY: Jumlah bagian yang dibutuhkan
    - Unit: EA (Each)
  
  - **Dimensi Pembahanan** (Dim A - Raw):
    - Panjang (P): mm
    - Lebar (L): mm
    - Tebal (T): mm
  
  - **Biaya Material**:
    - Biaya Satuan (`biayaSatuan`): Rp per unit
    - **Kalkulasi**: Material Total = Biaya Satuan × QTY
  
  - **Manufacture** (Opsional):
    - Work Center: (cth: Mesin Potong, Mesin Ampelas)
    - Routing: Nama proses urut
    - Waktu WC: Durasi (menit)
    - Waktu Routing: Durasi (menit)
    - Biaya WC: Rp
    - Biaya Routing: Rp
    - **Kalkulasi**: Biaya Produksi = Biaya WC + Biaya Routing
  
  - **Treatment Opsional**:
    - **Glue (Lem)**:
      - Field: `glueArea` (area perekatan)
      - Waktu: `glueAreaTimeMin`
    
    - **Edging (Pinggiran)**:
      - Field: `edging` (jenis edging)
      - Sisi Edging: `sisiEdging` (jumlah sisi)
      - Waktu: `edgingTimeMin`
      - Biaya: `edgingCost` (Rp)
    
    - **Finishing (Finishing)**:
      - Field: `finishing` (jenis: cat, duco, stain, dll)
      - Sisi Veneer: `sisiVeneer` (area yang di-finish)
      - Waktu: `finishingTimeMin`
      - Biaya: `finishingCost` (Rp)
    
    - **Treatment Custom**:
      - Field: `treatment` (deskripsi treatment tambahan)
  
  - **Kalkulasi Total Part**:
    ```
    Biaya Total Part = (Biaya Satuan × QTY) + Biaya WC + Biaya Routing 
                      + Biaya Edging + Biaya Finishing
    ```

#### D. Tambah Level Operation (di bawah Part)
- **Aksi**: Pilih parent Part → "Tambah Operation"
- **Input**:
  - Nama Proses: (cth: "Assembly", "Quality Check")
  - Jumlah Pekerja: (`workerCount`)
  - Gaji Pekerja: Pilih dari Master ERP atau input manual
  
  - **Opsi 1: Proses dengan Mesin**:
    - Load Master Work Center (from ERP)
    - Setup Time: Menit
    - Run Time: Menit
    - Machine Cost/Hour: Rp
    - **Kalkulasi**: 
      ```
      Total Biaya = ((Setup + Run) / 60) × Cost Per Hour
      ```
  
  - **Opsi 2: Proses Manual (Only Labor)**:
    - Nama Proses: Input manual
    - Jumlah Pekerja: Input
    - Waktu Per Unit: Menit
    - Biaya Per Jam: Rp
    - **Kalkulasi**:
      ```
      Total Biaya = (Waktu × Jumlah Pekerja / 60) × Biaya Per Jam
      ```
  
  - **Opsi 3: Tidak Ada (Skip)**:
    - Lewati input operation

---

## 3. Perhitungan Biaya Hierarki

### 3.1 Alur Perhitungan

```
┌─────────────────────────────────────────┐
│  MODUL                                  │
│  Biaya = SUM(SubModul) + Treatment      │
├─────────────────────────────────────────┤
│ ├─ SUB MODUL                            │
│ │  Biaya = SUM(Part + Operation) + Treat│
│ │                                       │
│ │  ├─ PART                              │
│ │  │  Biaya = (Satuan × QTY)            │
│ │  │         + Manufacture Cost         │
│ │  │         + Treatment Cost           │
│ │  │                                    │
│ │  │  └─ OPERATION                      │
│ │  │     Biaya = (Waktu / 60) × Rate    │
│ │  │            × Jumlah Pekerja        │
│ │  │                                    │
│ │  └─ [TREATMENT]                       │
│ │     - Glue Cost                       │
│ │     - Edging Cost                     │
│ │     - Finishing Cost                  │
│ │                                       │
│ └─ [TREATMENT]                          │
│    - Glue Cost                          │
│    - Edging Cost                        │
│    - Finishing Cost                     │
└─────────────────────────────────────────┘
```

### 3.2 Implementasi Perhitungan

#### File: `lib/calculations.ts`

**Fungsi Utama:**

1. **`calcVolCutting(row)`** - Volume bahan yang dipotong
   ```typescript
   Volume = (Panjang × Lebar × Tebal × QTY) / 1e9 m³
   ```

2. **`calcTreatmentCost(row)`** - Total biaya treatment
   ```typescript
   Treatment Cost = Biaya Edging + Biaya Finishing + Cost Glue
   ```

3. **`calcRowTotalCost(row)`** - Biaya total per baris
   ```typescript
   Total = (Biaya Satuan × QTY) + Biaya Operasi + Treatment Cost
   ```

4. **`calcHierarchicalCost(rows, rowId)`** - Biaya hierarki dengan children
   ```typescript
   Untuk Module/Submodule:
     Cost = Direct Cost + SUM(Children Cost)
   Untuk Part/Operation:
     Cost = Direct Cost
   ```

5. **`computeSummary(bomRows)`** - Summary keseluruhan BOM
   ```typescript
   return {
     biayaSatuan,    // Total material cost
     edgingCost,     // Total edging
     finishingCost,  // Total finishing
     mfgCost,        // Total manufacture (WC + Routing)
     treatmentCost,  // Total treatment
     grand           // GRAND TOTAL
   }
   ```

---

## 4. Tampilkan Hasil & Setup Final

### 4.1 View Kalkulasi
- **Komponen**: `KalkulasiDialog`
- **Akses**: Klik tombol "HITUNG" atau "View Kalkulasi"
- **Menampilkan**:
  - Summary cards (Material, Manufacture, Edging, Finishing, Grand Total)
  - Detail tabel per baris dengan breakdown biaya
  - Statistik komponen (Total Modul, Sub Modul, Part, Operation)

### 4.2 Setup Cost Final (Margin & Safety Factor)
- **Input Field** (akan ditambahkan di KalkulasiDialog):
  - **Margin %**: Keuntungan yang diinginkan (cth: 20%)
  - **Safety Factor**: Faktor keamanan/contingency (cth: 1.1x)
  
- **Rumus**:
  ```
  Harga Jual = (Grand Total × Safety Factor) × (1 + Margin %)
  ```

### 4.3 Tombol HITUNG (Final Calculation)
- **Aksi**: Setelah setup margin & safety factor
- **Output**: Tab hasil dengan total harga jual final

---

## 5. Validasi Data Alur

### Checklist Implementasi

- [x] **Metadata Input**: Customer, Buyer, QTY, Dimensi terinisialisasi
- [x] **Struktur Hierarki**: Module → Submodule → Part → Operation
- [x] **Treatment Fields**: Glue, Edging, Finishing tersedia di Detail Drawer
- [x] **Perhitungan Volume**: Cutting Volume & Invoice Volume kalkulasi otomatis
- [x] **Cost Flow**: Material + Manufacture + Treatment terakumulasi per level
- [x] **Summary Calculation**: `computeSummary()` menggunakan hierarchical logic
- [x] **Display**: KalkulasiDialog menampilkan breakdown lengkap
- [ ] **Margin & Safety Factor**: Perlu ditambahkan di final calculation
- [ ] **Master Data Integration**: Integration dengan Master Work Center & Master Materials

---

## 6. User Flow Diagram

```
START
  ↓
┌─────────────────────────────────┐
│ 1. Setup Produk                 │
│ - Kode, Nama                    │
│ - Customer, Buyer               │
│ - Qty, Dimensi                  │
└────────────┬────────────────────┘
             ↓
        Pilih Modul ← (Tidak Ada Modul?)
             |                    
        Ada Modul? ─→ Tidak ─→ Keluar ke Summary
             |  
             Ya
             ↓
      Pilih Sub Modul
         (Opsional)
             ↓
      Tambah Part atau Operation
             ↓
       ┌─────────────────┐
       │ Treatment?      │
       │ (Opsional)      │
       └────┬────────────┘
            |
     Ya ─→ Glue/Edging/Finishing
            |
            Tidak
            ↓
    Tambah Lagi? ─→ Ya → Kembali ke "Pilih Modul"
            |
            Tidak
            ↓
      Tampil Hasil
            ↓
    Setup Margin/Safety Factor
            ↓
       HITUNG (Final)
            ↓
         Output
           Harga
           Jual
            ↓
          END
```

---

## 7. Database Schema (Types)

### BomMetadata
```typescript
{
  productCode: string;        // Kode produk
  productName: string;        // Nama produk
  customer: string;           // Nama customer
  buyerCode: string;          // Kode buyer
  bomQuantity: string;        // QTY yang diproduksi
  currency: 'IDR' | 'USD';
  itemWidth: string;          // Lebar (mm)
  itemDepth: string;          // Kedalaman (mm)
  itemHeight: string;         // Tinggi (mm)
}
```

### BomRow (Level: module | submodule | part | operation)
```typescript
{
  id: string;
  level: 'module' | 'submodule' | 'part' | 'operation';
  levelNum: 0 | 1 | 2 | 3;
  parentId: string | null;
  
  // Identitas
  partCode: string;
  description: string;
  modul: string;
  
  // Dimensi
  dimAP: string;              // Panjang raw (mm)
  dimAL: string;              // Lebar raw (mm)
  dimAT: string;              // Tebal raw (mm)
  volCut: string;             // Volume cutting (m³)
  
  // Biaya
  biayaSatuan: string;        // Biaya satuan material (Rp)
  
  // Manufacture
  workCenterCost: string;     // Biaya work center (Rp)
  routingCost: string;        // Biaya routing (Rp)
  
  // Treatment
  glueArea: string;           // Area glue
  glueAreaTimeMin: string;    // Waktu glue (menit)
  edging: string;             // Jenis edging
  edgingCost: string;         // Biaya edging (Rp)
  finishing: string;          // Jenis finishing
  finishingCost: string;      // Biaya finishing (Rp)
  treatment: string;          // Treatment custom
}
```

---

## 8. Notes & Catatan Implementasi

1. **Validasi Mandatory Fields**:
   - Setiap Part harus punya `biayaSatuan` atau `workCenterCost`
   - Setiap Module/SubModule harus punya minimal 1 child

2. **Perhitungan Default**:
   - Jika tidak ada treatment input → cost = 0
   - Jika QTY kosong → assume QTY = 1

3. **Safe Division**:
   - Semua pembagian menggunakan `parseFloat()` dengan fallback 0
   - Hindari division by zero

4. **Future Enhancement**:
   - Margin & Safety Factor UI
   - Master Work Center integration
   - Master Materials automatic cost lookup
   - Version management & change tracking
   - Export to PDF/Excel dengan formatting

---

**Status**: ✅ Implementation Ready
**Last Updated**: April 2026
**Version**: 1.0
