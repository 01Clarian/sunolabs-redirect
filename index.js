import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Helius RPC endpoint
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
    label = "SunoLabs Entry",
    message = "Confirm your submission",
  } = req.query;

  if (!recipient) return res.status(400).send("Missing recipient address");

  const safe = (s) =>
    (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SunoLabs Pay</title>

<style>
body {
  background: #0a0a0a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-align: center;
  padding: 80px 20px;
}
h2 { margin-bottom: 8px; }
button {
  background: #9945ff;
  border: none;
  border-radius: 8px;
  padding: 14px 28px;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s;
}
button:hover:not(:disabled) { background: #7e2fff; transform: scale(1.02); }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.info { margin-top: 20px; color: #aaa; font-size: 14px; }
#debug {
  margin-top: 30px;
  padding: 15px;
  background: #1a1a1a;
  border-radius: 8px;
  font-size: 11px;
  color: #888;
  text-align: left;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  font-family: 'Courier New', monospace;
  max-height: 280px;
  overflow-y: auto;
}
.log-success { color: #4ade80; }
.log-error { color: #ff6b6b; }
.log-info { color: #60a5fa; }
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
  const color = type === "error" ? "log-error" : type === "success" ? "log-success" : "log-info";
  debugEl.innerHTML += \`<div class="\${color}">\${new Date().toLocaleTimeString()} - \${msg}</div>\`;
  debugEl.scrollTop = debugEl.scrollHeight;
  console.log(msg);
}

log("🟢 Page loaded — initializing...");

let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Solana Web3.js loaded", "success");
} catch (err) {
  log("❌ Failed to load Solana lib: " + err.message, "error");
  alert("Error loading Solana library.");
}

const RPC_URL = "${RPC_URL}";
const RECIPIENT = "${safe(recipient)}";
const AMOUNT = parseFloat("${safe(amount)}");

// ✅ Phantom + Solflare only
function getWallet() {
  const w = window;
  if (w.solana?.isPhantom) return { provider: w.solana, name: "Phantom" };
  if (w.solflare?.isSolflare) return { provider: w.solflare, name: "Solflare" };
  return null;
}

async function sendPayment() {
  log("🖱️ Button click event triggered", "info");
  const wallet = getWallet();
  if (!wallet) {
    log("❌ No Phantom or Solflare found", "error");
    alert("Install Phantom or Solflare wallet first.");
    return;
  }

  const { provider, name } = wallet;
  log("🟣 Using wallet: " + name);
  try {
    await provider.connect();
    const conn = new Connection(RPC_URL, "confirmed");
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(RECIPIENT),
      lamports: Math.floor(AMOUNT * LAMPORTS_PER_SOL),
    });
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

    log("✍️ Requesting signature...");
    const signedTx = await provider.signTransaction(tx);
    const sig = await conn.sendRawTransaction(signedTx.serialize());
    await conn.confirmTransaction(sig, "confirmed");

    log("✅ Transaction confirmed: " + sig, "success");
    alert("✅ Payment successful!\\nSignature: " + sig);
  } catch (err) {
    log("❌ " + err.message, "error");
    alert("❌ " + err.message);
  }
}

// ✅ Reliable Attachment Function
function attachButtonHandler() {
  const btn = document.getElementById("sendBtn");
  if (!btn) return false;
  btn.onclick = (e) => { e.preventDefault(); sendPayment(); };
  log("✅ Button handler attached", "success");
  return true;
}

// FIX: Attach handler when the DOM is fully loaded, which is more reliable 
// than the previous setInterval polling.
document.addEventListener('DOMContentLoaded', () => {
    attachButtonHandler();
});
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});
