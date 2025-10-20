import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

// --- enable JSON for logging endpoint
app.use(express.json());

// ✅ Helius RPC
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

// === CLIENT → SERVER LOGGING ===
app.post("/log", (req, res) => {
  const { event, detail } = req.body || {};
  console.log(`🟣 [CLIENT LOG] ${event}: ${detail || "no details"}`);
  res.sendStatus(200);
});

// === BASIC ROUTE ===
app.get("/", (_, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

// === PAYMENT PAGE ===
app.get("/pay", (req, res) => {
  const { recipient, amount = "0.01", label = "SunoLabs Entry", message = "Confirm your submission" } = req.query;

  if (!recipient) return res.status(400).send("Missing recipient address");

  const safe = (s = "") =>
    String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SunoLabs Pay</title>
<style>
body{background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px}
h2{margin-bottom:8px}
button{background:#9945ff;border:none;border-radius:8px;padding:14px 28px;font-size:16px;color:#fff;cursor:pointer;margin-top:20px;transition:all .2s}
button:hover{background:#7e2fff;transform:scale(1.02)}
.info{margin-top:20px;color:#aaa;font-size:14px}
#debug{margin-top:30px;padding:15px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#888;text-align:left;max-width:520px;margin:30px auto;font-family:'Courier New',monospace;max-height:280px;overflow-y:auto}
.log-success{color:#4ade80}
.log-error{color:#ff6b6b}
.log-info{color:#60a5fa}
</style>
</head>

<body>
<h2>💸 Send ${safe(amount)} SOL to SunoLabs</h2>
<p>${safe(label)}<br/>${safe(message)}</p>
<button id="sendBtn">💸 Send with Wallet</button>
<p class="info">Compatible with Phantom & Solflare wallets</p>
<div id="debug"><div style="color:#60a5fa;margin-bottom:10px;">📋 Debug Console:</div></div>

<script type="module">
const debugEl = document.getElementById("debug");
function log(msg, type="info") {
  const cls = type==="error"?"log-error":type==="success"?"log-success":"log-info";
  const t = new Date().toLocaleTimeString();
  debugEl.innerHTML += \`<div class="\${cls}">\${t} - \${msg}</div>\`;
  debugEl.scrollTop = debugEl.scrollHeight;
  console.log(msg);
  serverLog(type, msg);
}

async function serverLog(event, detail="") {
  try {
    await fetch("/log", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ event, detail })
    });
  } catch(e) { console.warn("serverLog failed:", e.message); }
}

log("🟢 Page loaded — initializing...");

let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Solana Web3.js loaded", "success");
} catch (err) {
  log("❌ Failed to load Web3.js: " + err.message, "error");
  alert("Error loading Solana library.");
}

const RPC_URL = "${RPC_URL}";
const RECIPIENT = "${safe(recipient)}";
const AMOUNT = parseFloat("${safe(amount)}");

function getWallet() {
  const w = window;
  if (w.solana?.isPhantom) return { provider: w.solana, name: "Phantom" };
  if (w.solflare?.isSolflare) return { provider: w.solflare, name: "Solflare" };
  return null;
}

async function sendPayment() {
  log("🖱️ Button clicked", "info");
  const wallet = getWallet();
  if (!wallet) {
    log("❌ No Phantom or Solflare wallet detected", "error");
    alert("Install Phantom or Solflare first.");
    return;
  }

  const { provider, name } = wallet;
  log("🟣 Using wallet: " + name, "info");
  serverLog("wallet_detected", name);

  try {
    await provider.connect();
    serverLog("wallet_connected", provider.publicKey.toBase58());
    log("🔗 Connected: " + provider.publicKey.toBase58(), "success");

    const conn = new Connection(RPC_URL, "confirmed");
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(RECIPIENT),
      lamports: Math.floor(AMOUNT * LAMPORTS_PER_SOL)
    });

    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

    log("✍️ Requesting signature...", "info");
    const signed = await provider.signTransaction(tx);
    const sig = await conn.sendRawTransaction(signed.serialize());
    await conn.confirmTransaction(sig, "confirmed");

    log("✅ Transaction confirmed: " + sig, "success");
    serverLog("tx_confirmed", sig);
    alert("✅ Payment successful!\\nSignature: " + sig);
  } catch (err) {
    log("❌ Error: " + err.message, "error");
    serverLog("error", err.message);
    alert("❌ " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendBtn");
  if (btn) {
    btn.onclick = (e) => { e.preventDefault(); sendPayment(); };
    log("✅ Button handler attached", "success");
  } else {
    log("❌ Button element not found!", "error");
  }
});
</script>
</body>
</html>`);
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});

