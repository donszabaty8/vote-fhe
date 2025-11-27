import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// Infura RPC 配置
const { chains, publicClient } = configureChains(
  [sepolia],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: `https://sepolia.infura.io/v3/5b7c761195c943e9ac3cf850335fa8c2`,
      }),
    }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'FHEVM 加密投票系统',
  projectId: '1bbda94b2d41d45f0acdbc68eacb7c95', // 您可以在 WalletConnect 创建真实的 project ID
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains, wagmiConfig };

export { RainbowKitProvider, WagmiConfig };