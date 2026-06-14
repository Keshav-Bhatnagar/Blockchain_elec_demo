# 🗳️ Indian E-Voting & Blockchain Simulation Portal

A secure, decentralized, constituency-aware E-Voting portal representing a next-generation administrative framework for the Election Commission of India (ECI). This system synchronizes national geographic boundary datasets with localized smart contracts running on an Ethereum-compatible consensus layer.

---

## ⚡ System Architecture

The application comprises three core components:

```
                  ┌──────────────────────┐
                  │   Vite React Client  │
                  └──────────┬───────────┘
                             │ (REST/HTTP)
                             ▼
                  ┌──────────────────────┐
                  │ Express Node Server  │
                  └────┬────────────┬────┘
                       │            │
         (Mongoose)    │            │ (Ethers.js provider)
                       ▼            ▼
             ┌───────────┐    ┌───────────┐
             │  MongoDB  │    │  Hardhat  │
             └───────────┘    └───────────┘
```

1. **`frontend` (React + Vite + Tailwind/CSS):** 
   - Interactive, state-wise SVGs representing the **543 Parliamentary Constituencies**.
   - Real-time Results Dashboard reflecting certified votes directly from the ledger.
   - **ECI Control Vault** providing live progress bars for simulations.

2. **`backend` (Express + Mongoose):**
   - Serves election metadata, state statistics, and geographical boundaries.
   - Interfaces with MongoDB to verify administrative credentials and manage phases.
   - Exposes simulation endpoints that automatically trigger smart contract consensus writes.

3. **`blockchain` (Solidity + Hardhat 3):**
   - **`BallotBox.sol`** contract managing candidate nominations, zone authorization, and constituency-specific vote registries.
   - Built on role-based access control (`eciAdmin` authorization flow).

---

## 🛠️ Technology Stack

- **Client:** React 18, Vite, HSL-harmonized CSS, Tailwind CSS.
- **Server:** Node.js, Express.js, MongoDB (Mongoose).
- **Consensus:** Solidity `^0.8.19`, Ethers.js v6, Hardhat v3.

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port `27017`)

### 1. Hardhat Node (Blockchain)
Initialize and start the local JSON-RPC Ethereum node:
```bash
cd blockchain
npm install
npx hardhat node
```

### 2. Contract Deployment
Deploy the BallotBox contract onto the running localhost network:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*Take note of the success address (e.g. `0x5FbDB2315678afecb367f032d93F642f64180aa3`) and verify it matches the `VOTING_CONTRACT_ADDRESS` in your backend `.env`.*

### 3. Backend Setup & Seeding
Configure environment variables and populate MongoDB and the smart contract:
```bash
cd backend
npm install
# Create/verify backend/.env file:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/indian-e-voting
# VOTING_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
# BLOCKCHAIN_PROVIDER_URL=http://127.0.0.1:8545
# ADMIN_SECRET_PASSPHRASE="password123"

# Seed geographic boundaries & initial on-chain candidate states
npm run seed:india       # Populates MongoDB boundaries
npm run seed:blockchain  # Populates on-chain constituencies
npm run seed:parties     # Registers the 11 national political parties on-chain

# Start the Express API server
npm start
```

### 4. Frontend Setup
Start the local hot-reloaded dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000/` in your browser.

---

## 🧪 Simulation Lifecycle

1. Navigate to the **ECI Department Control Vault** at `/eci-department-control`.
2. Authenticate using the passphrase: `password123`.
3. Click the **Tester (All) quick demo** shortcut to gain full zone authorization.
4. Click **Run Realistic Election Simulation** to begin a non-blocking background transaction pipeline.
5. Track progress via the dynamic UI progress bar (`0% ➔ 100%`).
6. Once completed, results are automatically published and signed on the blockchain, updating the home map dashboard instantly.
