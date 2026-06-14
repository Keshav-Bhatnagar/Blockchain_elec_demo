import { ethers } from 'ethers';
import ballotBoxArtifact from '../../blockchain/artifacts/contracts/BallotBox.sol/BallotBox.json' with { type: 'json' };

export async function getBallotBoxContract() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);
  
  const contract = new ethers.Contract(
    process.env.VOTING_CONTRACT_ADDRESS,
    ballotBoxArtifact.abi,
    signer
  );
  
  return contract;
}
