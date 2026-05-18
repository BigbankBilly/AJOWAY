# AJO WAY First Circle Setup

## Circle Rules

- Members: 5
- Weekly contribution: 2 USDC
- Pot per round: 10 USDC
- Organizer/admin: `0x9F8984b32F5DfceAc7535C12125EAA4bE1c9b9da`
- Payout rule: first signed-up member receives the first pot, then the next member in order.

## Proposed Payout Order

1. Admin / You: `0x9F8984b32F5DfceAc7535C12125EAA4bE1c9b9da`
2. Friend 1: `0xCE4d235A31e06a746D1E837C92f094bAf2028169`
3. Friend 2: `0x8388220065F9D0a2BDfe91BC6574714aC4C0788C`
4. Friend 3: `0x49E735587C430b09469653beeCc8B8e59e5Ec00a`
5. Friend 4: `0x61AD566440B6925b0F5306E9c150beA70d4fd98d`

## Deployment Values

The Arc USDC contract uses 6 decimals for ERC-20 transfers, so:

- 2 USDC = `2000000`
- 10 USDC total pot = `10000000`

Use this once Friend 3's correct wallet address is confirmed:

```bash
WEEKLY_CONTRIBUTION=2000000
MEMBERS=0x9F8984b32F5DfceAc7535C12125EAA4bE1c9b9da,0xCE4d235A31e06a746D1E837C92f094bAf2028169,0x8388220065F9D0a2BDfe91BC6574714aC4C0788C,0x49E735587C430b09469653beeCc8B8e59e5Ec00a,0x61AD566440B6925b0F5306E9c150beA70d4fd98d
```

## Deployment Status

Ready to deploy to Arc Testnet once the admin wallet has testnet USDC for gas.
