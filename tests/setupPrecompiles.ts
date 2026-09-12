import { ethers } from "hardhat";

export async function setupPrecompiles() {
  const proverFactory = await ethers.getContractFactory("MockBlockProver");
  const mockProver = await proverFactory.deploy();
  await mockProver.waitForDeployment();

  const proverBytecode = await ethers.provider.getCode(await mockProver.getAddress());
  await ethers.provider.send("hardhat_setCode", [
    "0x0000000000000000000000000000000000000FD2",
    proverBytecode
  ]);

  const chainInfoFactory = await ethers.getContractFactory("MockChainInfo");
  const mockChainInfo = await chainInfoFactory.deploy();
  await mockChainInfo.waitForDeployment();

  const chainInfoBytecode = await ethers.provider.getCode(await mockChainInfo.getAddress());
  await ethers.provider.send("hardhat_setCode", [
    "0x0000000000000000000000000000000000000fD3",
    chainInfoBytecode
  ]);

  return { mockProver, mockChainInfo };
}