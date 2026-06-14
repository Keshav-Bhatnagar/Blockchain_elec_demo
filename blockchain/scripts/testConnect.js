import { network } from "hardhat";

async function main() {
  const conn = await network.connect();
  console.log("Connected network:", conn.networkName);
  const provider = conn.ethers.provider;
  const block = await provider.getBlockNumber();
  console.log("Current Block:", block);
}

main();
