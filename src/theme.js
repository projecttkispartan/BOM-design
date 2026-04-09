import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"DM Sans", "Arimo", sans-serif',
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, fontSize: '0.95rem' },
    subtitle2: { fontWeight: 600, color: '#64748b', fontSize: '0.8rem' },
    body2: { color: '#64748b' },
  },
  palette: {
    mode: 'dark',
    primary: { main: '#059669' },
    secondary: { main: '#475569' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#e2e8f0', secondary: '#94a3b8' },
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 4px 12px rgba(0,0,0,0.06)',
    '0 8px 24px rgba(0,0,0,0.08)',
    ...Array(21).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFamily: '"DM Sans", "Arimo", sans-serif' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 12 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontFamily: '"DM Sans", "Arimo", sans-serif', fontSize: 12 },
      },
    },
  },
});

export const antdToken = {
  fontFamily: '"DM Sans", "Arimo", sans-serif',
  colorPrimary: '#059669',
  borderRadius: 10,
};
