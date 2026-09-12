import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

function getAccounts(): string[] {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) return [];
  const normalized = pk.startsWith("0x") ? pk : `0x${pk}`;
  if (normalized.length === 66) return [normalized];
  return [];
}

const accounts = getAccounts();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.23',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    creditcoin_testnet: {
      url: process.env.CREDITCOIN_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network',
      chainId: 102031,
      accounts: accounts,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      chainId: 11155111,
      accounts: accounts,
    },
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
