import { createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from '@wagmi/connectors';
import { defineChain } from 'viem';
import { mainnet } from 'viem/chains';

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

export const CC3_CHAIN_PARAMS = {
  chainId: '0x18e8f', // 102031 in hex
  chainName: 'Creditcoin CC3 Testnet',
  nativeCurrency: {
    name: 'Creditcoin',
    symbol: 'tCTC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.cc3-testnet.creditcoin.network'],
  blockExplorerUrls: ['https://creditcoin-testnet.blockscout.com'],
};

/**
 * Robust network switcher that automatically enforces Creditcoin CC3 Testnet.
 * Prompts MetaMask / injected wallets to switch, and automatically adds the network
 * via wallet_addEthereumChain if it hasn't been configured in the user's wallet yet.
 */
export async function ensureCreditcoinNetwork(
  switchChainAsync?: (args: { chainId: number }) => Promise<any>
): Promise<boolean> {
  const CC3_CHAIN_ID = 102031;
  const CC3_HEX_CHAIN_ID = '0x18e8f';

  // 1. First attempt: Wagmi switchChainAsync
  if (switchChainAsync) {
    try {
      await switchChainAsync({ chainId: CC3_CHAIN_ID });
      return true;
    } catch (wagmiErr: any) {
      if (
        wagmiErr.code === 4001 ||
        wagmiErr.message?.includes('User rejected') ||
        wagmiErr.message?.includes('denied')
      ) {
        throw new Error('Network switch to Creditcoin CC3 was cancelled by user in wallet.');
      }
      console.warn('Wagmi switchChainAsync failed, falling back to direct window.ethereum:', wagmiErr);
    }
  }

  // 2. Second attempt: Direct EIP-1193 window.ethereum
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const ethereum = (window as any).ethereum;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CC3_HEX_CHAIN_ID }],
      });
      return true;
    } catch (switchError: any) {
      // 4902 indicates chain is not yet added to wallet
      const isUnrecognized =
        switchError.code === 4902 ||
        switchError.message?.includes('Unrecognized chain') ||
        switchError.message?.includes('wallet_addEthereumChain') ||
        switchError.message?.includes('not found') ||
        switchError.message?.includes('unknown');

      if (isUnrecognized) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CC3_CHAIN_PARAMS],
          });
          return true;
        } catch (addError: any) {
          if (
            addError.code === 4001 ||
            addError.message?.includes('User rejected') ||
            addError.message?.includes('denied')
          ) {
            throw new Error('Adding Creditcoin CC3 Testnet was cancelled by user in wallet.');
          }
          throw new Error('Please approve adding Creditcoin CC3 Testnet to your wallet.');
        }
      }

      if (
        switchError.code === 4001 ||
        switchError.message?.includes('User rejected') ||
        switchError.message?.includes('denied')
      ) {
        throw new Error('Switching to Creditcoin CC3 was cancelled by user in wallet.');
      }

      throw new Error(`Failed to switch to Creditcoin CC3: ${switchError.message || switchError}`);
    }
  }

  return false;
}

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64';

export const config = createConfig({
  chains: [creditcoinTestnet, mainnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Causora Protocol' }),
    walletConnect({ projectId: walletConnectProjectId, showQrModal: true }),
  ],
  transports: {
    [creditcoinTestnet.id]: http('https://rpc.cc3-testnet.creditcoin.network'),
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
  ssr: true,
});
