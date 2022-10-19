# Identidade Empresarial Digital - Web App
Example dApp code for the Lift Learning DeFi/Web3 course. 

## Install

```bash
npm ci
```

## Configure
Create the `.env.local` file with the RPC endpoint, contract address and issuer's address and private key. Find at the ied-contracts project description how to setup and run a local testnet.

```bash
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=XXX

NEXT_PUBLIC_ISSUER_ADDRESS=XXX
ISSUER_PRIVATE_KEY=XXX
```

## Run
```bash
npm run dev
```