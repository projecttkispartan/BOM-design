import { Global, css } from '@emotion/react';

export function GlobalStyles() {
  return (
    <Global
      styles={css`
        :root {
          --font-sans: 'DM Sans', 'Arimo', system-ui, sans-serif;
          --surface: #0f172a;
          --surface-elevated: #1e293b;
          --border: rgba(255,255,255,0.12);
          --border-subtle: rgba(255,255,255,0.08);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root {
          height: 100%;
          min-height: 100vh;
          font-family: var(--font-sans);
        }
        body { background: #0f172a; color: #e2e8f0; }
        #root {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #0f172a;
          min-height: 100vh;
        }
        .bom-row-modul {
          background: linear-gradient(90deg, #ecfdf5 0%, #f0fdfa 100%) !important;
          font-weight: 700 !important;
        }
        .bom-row-modul td { border-bottom: 1px solid #a7f3d0 !important; }
        .bom-row-modul:hover td { background: #d1fae5 !important; }
        .bom-row-submodul {
          background: #f0fdfa !important;
          font-weight: 600 !important;
        }
        .bom-row-submodul td { border-bottom: 1px solid #99f6e4 !important; }
        .bom-row-submodul:hover td { background: #ccfbf1 !important; }
        .bom-row-part { background: var(--surface-elevated) !important; }
        .bom-row-part td { border-bottom: 1px solid var(--border-subtle) !important; }
        .bom-row-part:hover td { background: #f8fafc !important; }
        .ant-table-tbody > tr:hover > td { background: inherit !important; }
        .bom-table-modern .ant-table-tbody > tr { transition: background 0.15s ease; }
      `}
    />
  );
}
