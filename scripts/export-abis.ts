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

export const BLOCK_PROVER_ABI = ${JSON.stringify(verifierArtifact.abi, null, 2)} as const;

export const CHAIN_INFO_ABI = ${JSON.stringify(chainInfoArtifact.abi, null, 2)} as const;

export const CONTRACT_ADDRESSES = {
  blockProver: '0x0000000000000000000000000000000000000FD2',
  chainInfo: '0x0000000000000000000000000000000000000fD3',
  causoraRegistry: (process.env.NEXT_PUBLIC_CAUSORA_REGISTRY_ADDRESS || '0x9487c672C15F3354C11bce5539555cb523f0fe78') as \`0x\${string}\`,
  relationEngine: (process.env.NEXT_PUBLIC_RELATION_ENGINE_ADDRESS || '0x68f700445d3F7d0c3fe7E7d39B2A8A962F7f1a3A') as \`0x\${string}\`,
  causoraGuard: (process.env.NEXT_PUBLIC_CAUSORA_GUARD_ADDRESS || '0x3841D3B17f2A3F7499645832a24553258c73d9e2') as \`0x\${string}\`,
  lendingPositionManager: (process.env.NEXT_PUBLIC_LENDING_POSITION_MANAGER_ADDRESS || '0xD47aBC43194B4D864fa9c669146200EbD99026Ac') as \`0x\${string}\`,
} as const;
`;

  fs.writeFileSync(path.join(siteLibDir, 'generated-contracts.ts'), outputTs, 'utf8');
  console.log('✓ Successfully exported generated-contracts.ts with 100% authentic Hardhat ABIs!');
}

exportAbis();
