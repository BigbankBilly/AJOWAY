const ARC_CHAIN_ID = "0x4cef52";
const ARC_CHAIN_ID_DECIMAL = 5042002;
const ARC_RPC_URL = "https://rpc.testnet.arc.network";
const ARC_EXPLORER = "https://testnet.arcscan.app";
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const WEEKLY_CONTRIBUTION = 2000000n;

const MEMBERS = [
  "0x9F8984b32F5DfceAc7535C12125EAA4bE1c9b9da",
  "0xCE4d235A31e06a746D1E837C92f094bAf2028169",
  "0x8388220065F9D0a2BDfe91BC6574714aC4C0788C",
  "0x49E735587C430b09469653beeCc8B8e59e5Ec00a",
  "0x61AD566440B6925b0F5306E9c150beA70d4fd98d",
];

const els = {
  connectWallet: document.querySelector("#connectWallet"),
  switchNetwork: document.querySelector("#switchNetwork"),
  deployCircle: document.querySelector("#deployCircle"),
  clearLog: document.querySelector("#clearLog"),
  networkName: document.querySelector("#networkName"),
  walletAddress: document.querySelector("#walletAddress"),
  gasBalance: document.querySelector("#gasBalance"),
  artifactStatus: document.querySelector("#artifactStatus"),
  usdcAddress: document.querySelector("#usdcAddress"),
  weeklyContribution: document.querySelector("#weeklyContribution"),
  membersListText: document.querySelector("#membersListText"),
  resultBox: document.querySelector("#resultBox"),
  deployedAddress: document.querySelector("#deployedAddress"),
  arcscanLink: document.querySelector("#arcscanLink"),
  continueLink: document.querySelector("#continueLink"),
  activityLog: document.querySelector("#activityLog"),
};

let provider;
let signer;
let account;

function shortAddress(address) {
  if (!address || address === "--") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function log(message) {
  const item = document.createElement("li");
  item.textContent = message;
  els.activityLog.prepend(item);
}

function requireWallet() {
  if (!window.ethereum) {
    throw new Error("Install a wallet like MetaMask, Rabby, or Brave Wallet.");
  }
}

function explainError(error) {
  const message = `${error.shortMessage || error.reason || error.message || ""}`.toLowerCase();

  if (error.code === 4001 || message.includes("user rejected") || message.includes("rejected")) {
    return "Transaction rejected in wallet.";
  }

  if (message.includes("insufficient funds") || message.includes("not enough")) {
    return "Not enough Arc Testnet gas balance. The wallet may label it ETH, but on Arc it is USDC gas.";
  }

  if (message.includes("wrong network") || message.includes("chain")) {
    return "Wrong network. Switch your wallet to Arc Testnet and try again.";
  }

  return error.shortMessage || error.reason || error.message || "Something went wrong.";
}

async function updateNetworkAndBalance() {
  if (!provider || !account) return;

  const [network, balance] = await Promise.all([
    provider.getNetwork(),
    provider.getBalance(account),
  ]);

  const onArc = Number(network.chainId) === ARC_CHAIN_ID_DECIMAL;
  els.networkName.textContent = onArc ? "Arc Testnet" : `Chain ${network.chainId}`;
  els.gasBalance.textContent = `${ethers.formatEther(balance)} Arc gas`;
  els.deployCircle.disabled = !onArc;

  if (!onArc) {
    log("Switch to Arc Testnet before deploying.");
  }
}

async function connectWallet() {
  requireWallet();
  provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  account = accounts[0];
  signer = await provider.getSigner();
  els.walletAddress.textContent = shortAddress(account);
  els.connectWallet.textContent = "Connected";
  log(`Wallet connected: ${shortAddress(account)}`);
  await updateNetworkAndBalance();
}

async function switchToArc() {
  requireWallet();
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_ID }],
    });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARC_CHAIN_ID,
          chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: [ARC_RPC_URL],
          blockExplorerUrls: [ARC_EXPLORER],
        },
      ],
    });
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  els.walletAddress.textContent = shortAddress(account);
  log("Switched to Arc Testnet.");
  await updateNetworkAndBalance();
}

async function deployCircle() {
  if (!signer) await connectWallet();
  await updateNetworkAndBalance();

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== ARC_CHAIN_ID_DECIMAL) {
    throw new Error("Wrong network. Switch your wallet to Arc Testnet.");
  }

  const artifact = window.AJO_WAY_CONTRACT;
  if (!artifact?.abi || !artifact?.bytecode) {
    throw new Error("Contract artifact is missing. Reload the page and try again.");
  }

  els.deployCircle.disabled = true;
  els.deployCircle.textContent = "Deploying...";
  log("Opening wallet. Confirm the deployment transaction there.");

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(ARC_USDC, MEMBERS, WEEKLY_CONTRIBUTION, { value: 0n });
  const tx = contract.deploymentTransaction();

  if (tx?.hash) {
    log(`Deployment submitted: ${shortAddress(tx.hash)}`);
  } else {
    log("Deployment submitted. Waiting for confirmation.");
  }

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  els.resultBox.hidden = false;
  els.deployedAddress.textContent = address;
  els.arcscanLink.href = `${ARC_EXPLORER}/address/${address}`;
  els.continueLink.href = `./index.html?contract=${address}`;
  log(`Circle deployed: ${address}`);
}

async function run(action) {
  try {
    await action();
  } catch (error) {
    log(explainError(error));
  } finally {
    els.deployCircle.textContent = "Deploy circle";
    if (provider && account) {
      await updateNetworkAndBalance();
    } else {
      els.deployCircle.disabled = true;
    }
  }
}

function loadSetup() {
  els.usdcAddress.value = ARC_USDC;
  els.weeklyContribution.value = "2000000 (2 USDC)";
  els.membersListText.value = MEMBERS.map((member, index) => `${index + 1}. ${member}`).join("\n");
  els.deployCircle.disabled = true;

  if (window.AJO_WAY_CONTRACT?.abi && window.AJO_WAY_CONTRACT?.bytecode) {
    els.artifactStatus.textContent = "Ready";
  } else {
    els.artifactStatus.textContent = "Missing";
    log("Contract package missing. Reload the page before deploying.");
  }
}

els.connectWallet.addEventListener("click", () => run(connectWallet));
els.switchNetwork.addEventListener("click", () => run(switchToArc));
els.deployCircle.addEventListener("click", () => run(deployCircle));
els.clearLog.addEventListener("click", () => {
  els.activityLog.innerHTML = "";
});

if (window.ethereum) {
  window.ethereum.on("chainChanged", () => window.location.reload());
  window.ethereum.on("accountsChanged", () => window.location.reload());
}

loadSetup();
