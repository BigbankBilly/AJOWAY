# Deploy AJO WAY

## Recommended: Local Wallet Deployer

Use this first:

`http://localhost:4173/deploy.html`

The deployer is already filled with your first AJO WAY circle. Connect your wallet, switch to Arc Testnet, and click Deploy circle. Your private key stays inside your wallet.

## Backup: Remix

This path is best if you do not code and do not want to handle private keys. You will deploy from your wallet, and your private key stays inside MetaMask, Rabby, or whichever wallet you use.

## 1. Open Remix

Go to:

`https://remix.ethereum.org`

## 2. Create The Contract File

Create a new file named:

`AjoWayCircle.sol`

Paste the contents of:

[contracts/AjoWayCircle.sol](/Users/mac/Documents/Codex/2026-05-18/so-i-want-to-build-on/contracts/AjoWayCircle.sol)

## 3. Compile

Open the Solidity compiler tab.

Use compiler version:

`0.8.24`

Click:

`Compile AjoWayCircle.sol`

## 4. Connect Remix To Arc Testnet

Make sure your wallet is on Arc Testnet:

- Network: Arc Testnet
- RPC: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
- Currency: `USDC`
- Explorer: `https://testnet.arcscan.app`

In Remix, open the Deploy tab.

Set Environment to:

`Injected Provider`

Your admin wallet should appear:

`0x9F8984b32F5DfceAc7535C12125EAA4bE1c9b9da`

## 5. Deploy Constructor Values

Select contract:

`AjoWayCircle`

Use these constructor values:

```text
usdcAddress:
0x3600000000000000000000000000000000000000

circleMembers:
["0x9F8984b32F5DfceAc7535C12125EAA4bE1c9b9da","0xCE4d235A31e06a746D1E837C92f094bAf2028169","0x8388220065F9D0a2BDfe91BC6574714aC4C0788C","0x49E735587C430b09469653beeCc8B8e59e5Ec00a","0x61AD566440B6925b0F5306E9c150beA70d4fd98d"]

contributionAmount:
2000000
```

`2000000` means 2 USDC because Arc's ERC-20 USDC interface uses 6 decimals.

Click Deploy, then approve the wallet transaction.

## 6. Save The Contract Address

After deployment, Remix will show a deployed contract address. Copy it.

Open the AJO WAY app:

`http://localhost:4173`

Paste the contract address into the Circle contract field and click Load.

## 7. Weekly Flow

Each member does this every round:

1. Connect wallet.
2. Switch to Arc.
3. Paste the circle contract address.
4. Click Load.
5. Click Approve USDC.
6. Click Contribute.

Once all 5 members have contributed, the admin wallet clicks:

`Pay round`

The current recipient receives the full 10 USDC pot.
