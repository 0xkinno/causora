import * as fs from 'fs';
import * as path from 'path';

function exportAbis() {
  const rootDir = path.resolve(__dirname, '..');
  const artifactsDir = path.join(rootDir, 'artifacts', 'contracts');
  const siteLibDir = path.join(rootDir, 'site', 'lib');

  const registryArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'CausoraRegistry.sol', 'CausoraRegistry.json'), 'utf8')
  );
  const relationArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'RelationEngine.sol', 'RelationEngine.json'), 'utf8')
  );
  const guardArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'CausoraGuard.sol', 'CausoraGuard.json'), 'utf8')
  );
  const lendingArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'LendingPositionManager.sol', 'LendingPositionManager.json'), 'utf8')
  );
  const vaultArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'CausoraVault.sol', 'CausoraVault.json'), 'utf8')
  );
  const erc20Artifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'mocks', 'MockERC20.sol', 'MockERC20.json'), 'utf8')
  );
  const verifierArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'interfaces', 'INativeQueryVerifier.sol', 'INativeQueryVerifier.json'), 'utf8')
  );
  const chainInfoArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, 'interfaces', 'IChainInfo.sol', 'IChainInfo.json'), 'utf8')
  );

  const outputTs = `// AUTO-GENERATED FROM HARDHAT ARTIFACTS — DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}

export const CAUSORA_REGISTRY_ABI = ${JSON.stringify(registryArtifact.abi, null, 2)} as const;

export const RELATION_ENGINE_ABI = ${JSON.stringify(relationArtifact.abi, null, 2)} as const;

export const CAUSORA_GUARD_ABI = ${JSON.stringify(guardArtifact.abi, null, 2)} as const;

export const LENDING_POSITION_MANAGER_ABI = ${JSON.stringify(lendingArtifact.abi, null, 2)} as const;

export const CAUSORA_VAULT_ABI = ${JSON.stringify(vaultArtifact.abi, null, 2)} as const;

export const MOCK_ERC20_ABI = ${JSON.stringify(erc20Artifact.abi, null, 2)} as const;

export const BLOCK_PROVER_ABI = ${JSON.stringify(verifierArtifact.abi, null, 2)} as const;

export const CHAIN_INFO_ABI = ${JSON.stringify(chainInfoArtifact.abi, null, 2)} as const;

export const CONTRACT_ADDRESSES = {
  blockProver: '0x0000000000000000000000000000000000000FD2',
  chainInfo: '0x0000000000000000000000000000000000000fD3',
  causoraRegistry: (process.env.NEXT_PUBLIC_CAUSORA_REGISTRY_ADDRESS || '0x9D0ED40615845ee6134F475AcCF35e0412CA1EdF') as \`0x\${string}\`,
  relationEngine: (process.env.NEXT_PUBLIC_RELATION_ENGINE_ADDRESS || '0xFa34633c12e5A93166FAA0E54A3D50Fd62Ae8D49') as \`0x\${string}\`,
  causoraGuard: (process.env.NEXT_PUBLIC_CAUSORA_GUARD_ADDRESS || '0x029192f49d95eD5B147cE7E6Fc18d01BDfb513c5') as \`0x\${string}\`,
  lendingPositionManager: (process.env.NEXT_PUBLIC_LENDING_MANAGER_ADDRESS || '0x33979FFdC1B60cF727A90c043f1EC5CB15f6BB91') as \`0x\${string}\`,
  causoraVault: (process.env.NEXT_PUBLIC_CAUSORA_VAULT_ADDRESS || '0x7047D67Ef69F40F9340Fd97EDF79276458238cfe') as \`0x\${string}\`,
  mockERC20: (process.env.NEXT_PUBLIC_MOCK_ERC20_ADDRESS || '0x43410D288dFA265A560eb7DfFCa2991fA687d78d') as \`0x\${string}\`,
} as const;
`;

  fs.writeFileSync(path.join(siteLibDir, 'generated-contracts.ts'), outputTs, 'utf8');
  console.log('✓ Successfully exported generated-contracts.ts with 100% authentic Hardhat ABIs!');
}

exportAbis();
