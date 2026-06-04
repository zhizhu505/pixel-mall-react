import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

import { RouterProvider } from 'react-router';
import router from './router';
import { ServiceProvider } from './contexts/ServiceContext';
import { ThemeProvider } from './contexts/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ServiceProvider>
        <RouterProvider router={router}>
        </RouterProvider>
      </ServiceProvider>
    </ThemeProvider>
  </React.StrictMode>
);
