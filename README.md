# Sistem Kalkulasi BOM Multi-Level — React

Aplikasi web untuk kalkulasi Bill of Materials (BOM) furnitur: **React**, font **Arimo**, styling **Emotion (CSS-in-JS)** + **PostCSS**, **Material UI** dan **Ant Design**.

## Menjalankan

```bash
cd "d:\Sourcode\Bom 2"
npm install
npm run dev
```

Buka: **http://localhost:3333**

Build production: `npm run build` → output di `dist/`.

## Tech stack

- **React 18** + **Vite**
- **Font:** Arimo (Google Fonts)
- **Styling:** Emotion (`@emotion/react`, `@emotion/styled`) + PostCSS (autoprefixer)
- **Material UI (MUI):** Theme, AppBar, TextField, Tabs, Dialog, Snackbar, CssBaseline
- **Ant Design:** Button, Table (tree data untuk BOM), Tag, ConfigProvider

## Struktur

- `index.html` — Entry HTML, link font Arimo
- `src/main.jsx` — React root, ThemeProvider (MUI), ConfigProvider (Ant), BomProvider
- `src/theme.js` — MUI theme + Ant Design token (font Arimo, primary color)
- `src/App.jsx` — Layout: Toolbar, Metadata, Tabs, BOM/Hardware, CommandPalette, Snackbar
- `src/context/BomContext.jsx` — State (metadata, bomRows, hardwareRows), actions (addModul, addSubModul, addPart, save, density)
- `src/utils/initialState.js` — Default metadata, defaultBomRows (Meja Makan), defaultHardwareRows, helpers
- `src/utils/calculations.js` — Vol Cutting, Vol Invoice, M Lari, M2, recomputeRow
- `src/components/Toolbar.jsx` — MUI AppBar + Ant Button
- `src/components/MetadataSection.jsx` — MUI TextField (metadata)
- `src/components/BomTable.jsx` — Ant Design Table (tree), Tag MODUL/SUB MODUL/PART
- `src/components/HardwareTable.jsx` — Ant Design Table
- `src/components/CommandPalette.jsx` — MUI Dialog + List (Ctrl+K)
- `src/styles/GlobalStyles.jsx` — Emotion Global (font, layout)
- `postcss.config.js` — PostCSS (autoprefixer)
- `vite.config.js` — Vite + React plugin

## Fitur

- BOM tree: Modul → Sub Modul → Part (expand/collapse)
- Toolbar: + Modul, + Sub Modul, + Part, Simpan Draft, Command
- Metadata: Customer, Item Type, Wood, Coating, Item Dim, Vol M3
- Tab BOM Kayu & Komponen / Hardware & Fittings
- Command palette (Ctrl+K): Tambah Modul/Sub Modul/Part, Simpan, Ganti tab, Density
- Simpan draft ke localStorage
