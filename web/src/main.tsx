import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';
import { OrgProvider } from './org/OrgContext';

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#1d4ed8' } },
  shape: { borderRadius: 10 },
});

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('root element missing');
}
createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <App />
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
