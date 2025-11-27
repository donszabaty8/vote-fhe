import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Wallet configuration
import { chains, wagmiConfig, RainbowKitProvider, WagmiConfig } from './config/wallet'
import '@rainbow-me/rainbowkit/styles.css'

// Language context
import { LanguageProvider } from './contexts/LanguageContext'

// App and styles
import App from './App'
import './index.css'

// Create a query client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </LanguageProvider>
  </React.StrictMode>,
)