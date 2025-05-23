import { createRoot } from 'react-dom/client'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import { CartProvider } from './contexts/CartContext'
import { StoreProvider } from './contexts/StoreContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StoreProvider>
          <CartProvider>
            <App />
            <Toaster position="top-center" richColors />
          </CartProvider>
        </StoreProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
