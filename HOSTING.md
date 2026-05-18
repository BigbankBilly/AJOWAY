# Hosting AJO WAY On Vercel

The app is ready to host as a static website. The homepage automatically loads the live AJO WAY circle:

`0xbB52B53087711164d685cC03569b074C79d91498`

## Deploy With Vercel

1. Create a GitHub repository named `ajo-way`.
2. Upload this project folder to the repository.
3. Go to `https://vercel.com/new`.
4. Import the `ajo-way` GitHub repository.
5. Use these settings:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click Deploy.

## Public Link

After deployment, your friends can open:

`https://YOUR-VERCEL-SITE.vercel.app`

They can also open the direct invite link:

`https://YOUR-VERCEL-SITE.vercel.app/?contract=0xbB52B53087711164d685cC03569b074C79d91498`

## Friend Flow

Each friend should:

1. Open the public site.
2. Connect their wallet.
3. Switch to Arc Testnet.
4. Click Approve USDC.
5. Click Contribute.
