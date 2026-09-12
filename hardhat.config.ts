import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 
  ? [process.env.PRIVATE_KEY] 
  : [];

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
      accounts: PRIVATE_KEY,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      chainId: 11155111,
      accounts: PRIVATE_KEY,
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
