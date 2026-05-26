const ARC_CHAIN_ID = "0x4cef52";
const ARC_CHAIN_ID_DECIMAL = 5042002;
const ARC_RPC_URL = "https://rpc.testnet.arc.network";
const ARC_EXPLORER = "https://testnet.arcscan.app";
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const DEFAULT_CIRCLE_ADDRESS = "0xbB52B53087711164d685cC03569b074C79d91498";
const supabaseConfig = window.AJO_WAY_SUPABASE;
const supabaseClient = supabaseConfig?.url && supabaseConfig?.anonKey && window.supabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
const MEMBER_LABELS = {
  "0x9f8984b32f5dfceac7535c12125eaa4be1c9b9da": "BigbankBilly",
  "0xce4d235a31e06a746d1e837c92f094baf2028169": "Friend 1",
  "0x8388220065f9d0a2bdfe91bc6574714ac4c0788c": "Friend 2",
  "0x49e735587c430b09469653beecc8b8e59e5ec00a": "Friend 3",
  "0x61ad566440b6925b0f5306e9c150bea70d4fd98d": "Friend 4",
};

const circleAbi = [
  "error AlreadyContributed()",
  "error CircleClosed()",
  "error NotMember()",
  "error OnlyOrganizer()",
  "error RoundNotComplete()",
  "error TransferFailed()",
  "function currentRound() view returns (uint256)",
  "function weeklyContribution() view returns (uint256)",
  "function memberCount() view returns (uint256)",
  "function currentRecipient() view returns (address)",
  "function roundContributionCount(uint256) view returns (uint256)",
  "function hasContributed(uint256,address) view returns (bool)",
  "function organizer() view returns (address)",
  "function getMembers() view returns (address[])",
  "function contribute()",
  "function payCurrentRound()",
];

const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const els = {
  connectWallet: document.querySelector("#connectWallet"),
  openLogin: document.querySelector("#openLogin"),
  switchNetwork: document.querySelector("#switchNetwork"),
  approveUsdc: document.querySelector("#approveUsdc"),
  contribute: document.querySelector("#contribute"),
  payRound: document.querySelector("#payRound"),
  loadCircle: document.querySelector("#loadCircle"),
  copyInvite: document.querySelector("#copyInvite"),
  clearLog: document.querySelector("#clearLog"),
  contractAddress: document.querySelector("#contractAddress"),
  contractExplorer: document.querySelector("#contractExplorer"),
  networkName: document.querySelector("#networkName"),
  walletAddress: document.querySelector("#walletAddress"),
  roundNumber: document.querySelector("#roundNumber"),
  weeklyStake: document.querySelector("#weeklyStake"),
  recipient: document.querySelector("#recipient"),
  paidCount: document.querySelector("#paidCount"),
  heroPot: document.querySelector("#heroPot"),
  heroRecipient: document.querySelector("#heroRecipient"),
  heroProgress: document.querySelector("#heroProgress"),
  memberCount: document.querySelector("#memberCount"),
  progressFill: document.querySelector("#progressFill"),
  membersList: document.querySelector("#membersList"),
  activityLog: document.querySelector("#activityLog"),
  loginDialog: document.querySelector("#loginDialog"),
  loginName: document.querySelector("#loginName"),
  loginEmail: document.querySelector("#loginEmail"),
  saveLogin: document.querySelector("#saveLogin"),
  waitlistForm: document.querySelector("#waitlistForm"),
  waitlistName: document.querySelector("#waitlistName"),
  waitlistEmail: document.querySelector("#waitlistEmail"),
  waitlistWallet: document.querySelector("#waitlistWallet"),
  customCircleForm: document.querySelector("#customCircleForm"),
  customCircleName: document.querySelector("#customCircleName"),
  customMemberCount: document.querySelector("#customMemberCount"),
  customContribution: document.querySelector("#customContribution"),
};

let provider;
let readProvider;
let signer;
let account;
let circle;
let weeklyContribution = 0n;
let currentCircleAddress = "";
let currentSession = null;

function shortAddress(address) {
  if (!address || address === "--") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function memberLabel(address) {
  const savedLabels = JSON.parse(localStorage.getItem("ajoWayMemberLabels") || "{}");
  return savedLabels[address.toLowerCase()] || MEMBER_LABELS[address.toLowerCase()] || "Member";
}

function saveProfile(name, email) {
  const profile = { name: name.trim(), email: email.trim() };
  localStorage.setItem("ajoWayProfile", JSON.stringify(profile));
  els.openLogin.textContent = profile.name || "Email login";
  return profile;
}

function loadProfile() {
  const profile = JSON.parse(localStorage.getItem("ajoWayProfile") || "null");
  if (!profile) return;

  els.loginName.value = profile.name || "";
  els.loginEmail.value = profile.email || "";
  els.openLogin.textContent = profile.name || "Email login";
}

async function loadSupabaseSession() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    log("Could not check email login session.");
    return;
  }

  currentSession = data.session;
  if (!currentSession?.user) return;

  const email = currentSession.user.email || "";
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("name_tag,email,wallet_address")
    .eq("id", currentSession.user.id)
    .maybeSingle();

  if (profile?.name_tag) {
    saveProfile(profile.name_tag, profile.email || email);
    if (profile.wallet_address) els.waitlistWallet.value = profile.wallet_address;
    log(`Signed in as ${profile.name_tag}.`);
    return;
  }

  if (email) {
    saveProfile(email.split("@")[0], email);
    log(`Signed in as ${email}.`);
  }
}

function requireSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured yet.");
  }
}

async function requireEmailSession() {
  requireSupabase();
  if (!currentSession?.user) {
    throw new Error("Sign in with email first, then try again.");
  }

  return currentSession;
}

async function saveSupabaseProfile(name, email, walletAddress = "") {
  const session = await requireEmailSession();
  const { error } = await supabaseClient.from("profiles").upsert({
    id: session.user.id,
    email,
    name_tag: name,
    wallet_address: walletAddress || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

function setActionState({ isMember = false, hasPaid = false, isOrganizer = false, roundComplete = false } = {}) {
  els.approveUsdc.disabled = !isMember || hasPaid;
  els.contribute.disabled = !isMember || hasPaid;
  els.payRound.disabled = !isOrganizer || !roundComplete;
  els.payRound.hidden = !isOrganizer;

  els.approveUsdc.textContent = hasPaid ? "Approved" : "Approve USDC";
  els.contribute.textContent = hasPaid ? "Contributed" : "Contribute";
}

function log(message) {
  const item = document.createElement("li");
  item.textContent = message;
  els.activityLog.prepend(item);
}

function requireWallet() {
  if (!window.ethereum) {
    throw new Error("Install a wallet like MetaMask or Rabby.");
  }
}

function getCircleAddress() {
  const address = els.contractAddress.value.trim();
  if (!ethers.isAddress(address)) {
    throw new Error("Enter a valid circle contract address.");
  }
  return address;
}

function loadContractFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const address = params.get("contract") || DEFAULT_CIRCLE_ADDRESS;

  if (address && ethers.isAddress(address)) {
    els.contractAddress.value = address;
    log(`Circle address loaded: ${shortAddress(address)}`);
    return true;
  }

  return false;
}

async function connectWallet() {
  requireWallet();
  provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  account = accounts[0];
  signer = await provider.getSigner();
  els.walletAddress.textContent = shortAddress(account);
  els.connectWallet.textContent = "Connected";
  await updateNetwork();
  log(`Wallet connected: ${shortAddress(account)}`);

  if (els.contractAddress.value.trim()) {
    await loadCircle();
  }
}

async function updateNetwork() {
  if (!provider) return;
  const network = await provider.getNetwork();
  els.networkName.textContent = Number(network.chainId) === ARC_CHAIN_ID_DECIMAL ? "Arc Testnet" : `Chain ${network.chainId}`;
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
  await updateNetwork();
  log("Switched to Arc Testnet.");
}

async function loadCircle() {
  const address = getCircleAddress();
  currentCircleAddress = address;
  readProvider ||= new ethers.JsonRpcProvider(ARC_RPC_URL);
  circle = new ethers.Contract(address, circleAbi, signer || readProvider);
  if (!provider) {
    els.networkName.textContent = "Arc Testnet";
  }

  const round = await circle.currentRound();
  const [stake, count, nextRecipient, paid, members, organizer] = await Promise.all([
    circle.weeklyContribution(),
    circle.memberCount(),
    circle.currentRecipient(),
    circle.roundContributionCount(round),
    circle.getMembers(),
    circle.organizer(),
  ]);
  const paidStatuses = await Promise.all(members.map((member) => circle.hasContributed(round, member)));
  const lowerAccount = account?.toLowerCase();
  const isCurrentMember = members.some((member) => member.toLowerCase() === lowerAccount);
  const currentMemberIndex = members.findIndex((member) => member.toLowerCase() === lowerAccount);
  const currentMemberHasPaid = currentMemberIndex >= 0 ? paidStatuses[currentMemberIndex] : false;
  const roundComplete = paid === count;
  const isOrganizer = organizer.toLowerCase() === lowerAccount;

  weeklyContribution = stake;
  els.roundNumber.textContent = round.toString();
  els.weeklyStake.textContent = `${ethers.formatUnits(stake, 6)} USDC`;
  els.recipient.textContent = shortAddress(nextRecipient);
  els.paidCount.textContent = `${paid.toString()} of ${count.toString()}`;
  els.heroPot.textContent = `${ethers.formatUnits(stake * count, 6)} USDC`;
  els.heroRecipient.textContent = shortAddress(nextRecipient);
  els.heroProgress.textContent = `${paid.toString()} / ${count.toString()} paid`;
  els.memberCount.textContent = count.toString();
  els.progressFill.style.width = `${(Number(paid) / Number(count)) * 100}%`;
  els.contractExplorer.href = `${ARC_EXPLORER}/address/${address}`;
  els.contractExplorer.textContent = "View contract";
  setActionState({
    isMember: isCurrentMember,
    hasPaid: currentMemberHasPaid,
    isOrganizer,
    roundComplete,
  });

  els.membersList.innerHTML = "";
  members.forEach((member, index) => {
    const item = document.createElement("li");
    item.className = "member-row";

    if (member.toLowerCase() === lowerAccount) {
      item.classList.add("current-wallet");
    }

    const label = document.createElement("span");
    label.innerHTML = `<strong>${index + 1}. ${memberLabel(member)}</strong><small>${shortAddress(member)}</small>`;
    item.append(label);

    const badges = document.createElement("div");
    badges.className = "member-badges";

    if (member.toLowerCase() === nextRecipient.toLowerCase()) {
      const badge = document.createElement("strong");
      badge.className = "recipient-badge";
      badge.textContent = "Recipient";
      badges.append(badge);
    }

    const status = document.createElement("strong");
    status.className = paidStatuses[index] ? "paid-badge" : "waiting-badge";
    status.textContent = paidStatuses[index] ? "Paid" : "Waiting";
    badges.append(status);
    item.append(badges);

    els.membersList.append(item);
  });

  log(`Circle loaded: ${shortAddress(address)}`);
}

async function copyInvite() {
  const address = currentCircleAddress || getCircleAddress();
  const invite = `${window.location.origin}${window.location.pathname}?contract=${address}`;

  await navigator.clipboard.writeText(invite);
  log("Invite link copied.");
}

async function saveWaitlistEntry(event) {
  event.preventDefault();
  const session = await requireEmailSession();
  const entry = {
    user_id: session.user.id,
    name_tag: els.waitlistName.value.trim(),
    email: els.waitlistEmail.value.trim() || session.user.email,
    wallet_address: els.waitlistWallet.value.trim() || null,
  };

  if (!entry.name_tag || !entry.email) {
    log("Add your name tag and email to join the waitlist.");
    return;
  }

  if (entry.wallet_address && !ethers.isAddress(entry.wallet_address)) {
    log("That wallet address does not look valid.");
    return;
  }

  const { error } = await supabaseClient.from("waitlist").insert(entry);
  if (error) throw error;

  log(`${entry.name_tag} joined the next-circle waitlist.`);
  els.waitlistForm.reset();
}

async function saveCustomCircle(event) {
  event.preventDefault();
  const session = await requireEmailSession();
  const idea = {
    user_id: session.user.id,
    circle_name: els.customCircleName.value.trim(),
    member_count: Number(els.customMemberCount.value),
    weekly_usdc: Number(els.customContribution.value),
  };

  if (!idea.circle_name || idea.member_count < 2 || idea.weekly_usdc < 1) {
    log("Add a circle name, at least 2 members, and a weekly amount.");
    return;
  }

  const { error } = await supabaseClient.from("circle_requests").insert(idea);
  if (error) throw error;

  log(`${idea.circle_name} sent for review.`);
  els.customCircleForm.reset();
  els.customMemberCount.value = 5;
  els.customContribution.value = 2;
}

async function approveUsdc() {
  if (!signer) await connectWallet();
  const circleAddress = getCircleAddress();
  if (!weeklyContribution) await loadCircle();

  const usdc = new ethers.Contract(ARC_USDC, erc20Abi, signer);
  const tx = await usdc.approve(circleAddress, weeklyContribution);
  log(`Approval sent: ${shortAddress(tx.hash)}`);
  await tx.wait();
  log("USDC approved.");
}

async function contribute() {
  if (!signer) await connectWallet();
  circle = new ethers.Contract(getCircleAddress(), circleAbi, signer);
  const tx = await circle.contribute();
  log(`Contribution sent: ${shortAddress(tx.hash)}`);
  await tx.wait();
  log("Contribution confirmed.");
  await loadCircle();
}

async function payRound() {
  if (!signer) await connectWallet();
  circle = new ethers.Contract(getCircleAddress(), circleAbi, signer);
  const tx = await circle.payCurrentRound();
  log(`Round payout sent: ${shortAddress(tx.hash)}`);
  await tx.wait();
  log("Round paid.");
  await loadCircle();
}

async function run(action) {
  try {
    await action();
  } catch (error) {
    const message = error.shortMessage || error.reason || error.message || "Something went wrong.";
    const errorName = error.revert?.name || error.errorName;

    if (errorName === "AlreadyContributed") {
      log("Already contributed. This wallet has paid for the current round.");
      return;
    }

    if (errorName === "NotMember") {
      log("This wallet is not a member of this AJO WAY circle.");
      return;
    }

    if (errorName === "RoundNotComplete") {
      log("Round is not complete yet. Wait until all 5 members have contributed.");
      return;
    }

    if (errorName === "OnlyOrganizer") {
      log("Only the admin wallet can pay the round.");
      return;
    }

    if (message.toLowerCase().includes("allowance")) {
      log("Approval needed. Click Approve USDC, confirm it in your wallet, wait for it to finish, then click Contribute.");
      return;
    }

    log(message);
  }
}

els.connectWallet.addEventListener("click", () => run(connectWallet));
els.openLogin.addEventListener("click", () => els.loginDialog.showModal());
els.saveLogin.addEventListener("click", (event) => {
  event.preventDefault();
  run(async () => {
    requireSupabase();
    const name = els.loginName.value.trim();
    const email = els.loginEmail.value.trim();

    if (!name || !email) {
      log("Add your name tag and email to continue.");
      return;
    }

    if (window.location.protocol === "file:") {
      log("Email login needs the hosted site or local server, not a file link.");
      return;
    }

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
        data: { name_tag: name },
      },
    });
    if (error) throw error;

    saveProfile(name, email);
    localStorage.setItem("ajoWayPendingProfile", JSON.stringify({ name, email }));
    log(`Check ${email} for your AJO WAY login link.`);
    els.loginDialog.close();
  });
});
els.switchNetwork.addEventListener("click", () => run(switchToArc));
els.loadCircle.addEventListener("click", () => run(loadCircle));
els.copyInvite.addEventListener("click", () => run(copyInvite));
els.approveUsdc.addEventListener("click", () => run(approveUsdc));
els.contribute.addEventListener("click", () => run(contribute));
els.payRound.addEventListener("click", () => run(payRound));
els.clearLog.addEventListener("click", () => {
  els.activityLog.innerHTML = "";
});
els.waitlistForm.addEventListener("submit", saveWaitlistEntry);
els.customCircleForm.addEventListener("submit", saveCustomCircle);

if (window.ethereum) {
  window.ethereum.on("chainChanged", () => window.location.reload());
  window.ethereum.on("accountsChanged", () => window.location.reload());
}

setActionState();
loadProfile();
loadSupabaseSession().then(async () => {
  const pending = JSON.parse(localStorage.getItem("ajoWayPendingProfile") || "null");
  if (pending && currentSession?.user) {
    await saveSupabaseProfile(pending.name, pending.email);
    localStorage.removeItem("ajoWayPendingProfile");
  }
});
if (loadContractFromUrl()) {
  run(loadCircle);
}
