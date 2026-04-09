import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ConfigProvider } from 'antd';
import { BomProvider } from './context/BomContext';
import { muiTheme, antdToken } from './theme';
import './index.css';
import { GlobalStyles } from './styles/GlobalStyles';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <ConfigProvider theme={{ token: antdToken }}>
        <CssBaseline />
        <GlobalStyles />
        <BomProvider>
          <App />
        </BomProvider>
      </ConfigProvider>
    </ThemeProvider>
  </React.StrictMode>
);
