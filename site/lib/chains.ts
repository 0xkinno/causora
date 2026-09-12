export interface ChainConfig {
  id: number;
  name: string;
  network: string;
  chainKey: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers: {
    default: { name: string; url: string };
  };
  contracts?: {
    blockProver?: `0x${string}`;
    chainInfo?: `0x${string}`;
    causoraRegistry?: `0x${string}`;
    relationEngine?: `0x${string}`;
    causoraGuard?: `0x${string}`;
    lendingPositionManager?: `0x${string}`;
  };
}

export const CREDITCOIN_CC3_TESTNET: ChainConfig = {
  id: 102031,
  name: "Creditcoin CC3 Testnet",
  network: "creditcoin-testnet",
  chainKey: 2,
  nativeCurrency: {
    name: "Creditcoin",
    symbol: "tCTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.cc3-testnet.creditcoin.network"] },
    public: { http: ["https://rpc.cc3-testnet.creditcoin.network"] },
  },
  blockExplorers: {
    default: { name: "Creditcoin Explorer", url: "https://creditcoin-testnet.blockscout.com" },
  },
  contracts: {
    blockProver: "0x0000000000000000000000000000000000000FD2",
    chainInfo: "0x0000000000000000000000000000000000000fD3",
    causoraRegistry: "0x87F61f848EdD7C3e0752Ded3bf9C303E7c74BD81",
    relationEngine: "0x59a9771e60ED99cBC583fe4C3fd9e83e94AF606d",
    causoraGuard: "0x4CABa84eF2D49dCFfDD5456AADEA5A42eB4a4699",
    lendingPositionManager: "0x94B336Cdb7aDacffE270a8f1B607499Be3656518",
  }
};

export const ETHEREUM_SEPOLIA: ChainConfig = {
  id: 11155111,
  name: "Ethereum Sepolia",
  network: "sepolia",
  chainKey: 1,
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "SEP",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.org"] },
    public: { http: ["https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.org" },
  },
};

export const SUPPORTED_CHAINS = [CREDITCOIN_CC3_TESTNET, ETHEREUM_SEPOLIA];
