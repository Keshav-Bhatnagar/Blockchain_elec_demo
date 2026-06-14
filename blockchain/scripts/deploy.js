import { network } from "hardhat";

async function main() {
  console.log("Initializing Hardhat 3 network connection...");
  
  // Hardhat 3 exposes plugins via an asynchronous network connection instantiator
  const { ethers, networkName } = await network.connect();
  
  console.log(`Deploying BallotBox contract to network: ${networkName}...`);
  
  // Deploy using Hardhat 3's modern contract deployment framework
  const ballotBox = await ethers.deployContract("BallotBox");
  await ballotBox.waitForDeployment();

  const address = await ballotBox.getAddress();
  console.log(`\n==================================================`);
  console.log(`Success! BallotBox deployed to contract address:`);
  console.log(`${address}`);
  console.log(`==================================================\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
