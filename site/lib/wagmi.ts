import { createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from '@wagmi/connectors';
import { defineChain } from 'viem';

export const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin CC3 Testnet',
  nativeCurrency: {
    name: 'Creditcoin',
    symbol: 'tCTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.cc3-testnet.creditcoin.network'],
    },
    public: {
      http: ['https://rpc.cc3-testnet.creditcoin.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://creditcoin-testnet.blockscout.com',
    },
  },
  testnet: true,
});

export const sepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.org'],
    },
    public: {
      http: ['https://rpc.sepolia.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.org',
    },
  },
  testnet: true,
});

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64';

export const config = createConfig({
  chains: [creditcoinTestnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Causora Protocol' }),
    walletConnect({ projectId: walletConnectProjectId, showQrModal: true }),
  ],
  transports: {
    [creditcoinTestnet.id]: http('https://rpc.cc3-testnet.creditcoin.network'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
  ssr: true,
});
