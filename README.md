# AJO WAY

AJO WAY is a rotating savings circle for Arc Testnet. Friends contribute USDC each round, and one member receives the full pot. The recipient rotates every round until everyone has had a turn.

## What Is Built

- A smart contract at [contracts/AjoWayCircle.sol](/Users/mac/Documents/Codex/2026-05-18/so-i-want-to-build-on/contracts/AjoWayCircle.sol)
- A simple member app at [app/index.html](/Users/mac/Documents/Codex/2026-05-18/so-i-want-to-build-on/app/index.html)
- A Foundry deploy script at [script/DeployAjoWay.s.sol](/Users/mac/Documents/Codex/2026-05-18/so-i-want-to-build-on/script/DeployAjoWay.s.sol)

## How A Round Works

1. The organizer creates a circle with member wallet addresses and one weekly USDC amount.
2. Each member approves the circle contract to collect that weekly amount.
3. Each member contributes once for the current round.
4. When every member has paid, the organizer pays the pot to the current recipient.
5. The next round starts automatically with the next recipient in line.

## Arc Testnet Details

- Network: Arc Testnet
- RPC: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
- Gas token: USDC
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`
- USDC contract: `0x3600000000000000000000000000000000000000`

## First Real Setup

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge install foundry-rs/forge-std
```

Create a wallet:

```bash
cast wallet new
```

Add Arc Testnet to your wallet and request testnet USDC from the Circle Faucet. The wallet that deploys the circle becomes the organizer.

Create a `.env` file:

```bash
PRIVATE_KEY=your_private_key_without_quotes
WEEKLY_CONTRIBUTION=10000000
MEMBERS=0xMemberOne,0xMemberTwo,0xMemberThree
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

`WEEKLY_CONTRIBUTION=10000000` means 10 USDC because Arc's ERC-20 USDC interface uses 6 decimals.

Deploy:

```bash
source .env
forge script script/DeployAjoWay.s.sol:DeployAjoWay \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast
```

Copy the deployed contract address into the AJO WAY app.

## Open The App

Open [app/index.html](/Users/mac/Documents/Codex/2026-05-18/so-i-want-to-build-on/app/index.html) in a browser with MetaMask, Rabby, or another EVM wallet.

## Deploy Without Remix

Use the local wallet deployer:

`http://localhost:4173/deploy.html`

It has the first AJO WAY circle already filled in. Connect your wallet, switch to Arc Testnet, then click Deploy circle. Your wallet signs the deployment, and no private key is entered into the app.

## Host The Website

The app is ready for Vercel hosting. See [HOSTING.md](/Users/mac/Documents/Codex/2026-05-18/so-i-want-to-build-on/HOSTING.md).

## Important Notes Before Real Money

This is a starter contract for testnet. Before using real USDC on mainnet, add professional review, stronger organizer controls, member replacement rules, missed-payment handling, cancellation/refund logic, and a formal security audit.
