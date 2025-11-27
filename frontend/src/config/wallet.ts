import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';

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

// 手动配置钱包连接器，不包含 Safe
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId: '1bbda94b2d41d45f0acdbc68eacb7c95', chains }),
      rainbowWallet({ projectId: '1bbda94b2d41d45f0acdbc68eacb7c95', chains }),
      walletConnectWallet({ projectId: '1bbda94b2d41d45f0acdbc68eacb7c95', chains }),
      coinbaseWallet({ appName: 'FHEVM 加密投票系统', chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains, wagmiConfig };

export { RainbowKitProvider, WagmiConfig };